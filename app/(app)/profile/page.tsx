import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, signOut } from "@/app/actions/profile";
import { levelProgress, titleForLevel } from "@/lib/xp";
import { currentStreak, longestStreak } from "@/lib/streaks";

export const dynamic = "force-dynamic";

const AVATARS = ["🦊", "🐺", "🐯", "🦁", "🐉", "🦅", "🐙", "🦄", "👻", "🤖", "👑", "🔥"];

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: completions }, { count: habitCount }, { count: goalCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("completions").select("day").eq("user_id", user.id).order("day", { ascending: false }).limit(500),
    supabase.from("habits").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("archived", false),
    supabase.from("goals").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
  ]);

  const days = (completions ?? []).map((c) => c.day as string);
  const cur = currentStreak(days);
  const best = longestStreak(days);
  const prog = profile ? levelProgress(profile.total_xp) : { level: 1, pct: 0, into: 0, span: 100, toNext: 100 };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card !p-5 bg-gradient-to-br from-accent/10 to-accent2/5 border-accent/20 text-center">
        <div className="text-7xl">{profile?.avatar_emoji ?? "🦊"}</div>
        <div className="font-black text-xl mt-2">@{profile?.username}</div>
        <div className="text-accent text-sm">{titleForLevel(prog.level)} · LVL {prog.level}</div>
        <div className="mt-4 h-2 bg-panel2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-accent2" style={{ width: `${prog.pct}%` }} />
        </div>
        <div className="text-muted text-xs mt-1">{prog.toNext} XP to next level</div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="XP" value={(profile?.total_xp ?? 0).toLocaleString()} icon="⚡" />
        <Stat label="Streak" value={cur} icon="🔥" />
        <Stat label="Best" value={best} icon="🏅" />
        <Stat label="Goals" value={goalCount ?? 0} icon="🎯" />
      </div>

      <form action={updateProfile} className="card space-y-4">
        <h2 className="font-bold">Edit profile</h2>
        <div>
          <label className="text-sm text-muted">Avatar</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {AVATARS.map((e) => (
              <label key={e} className="cursor-pointer">
                <input
                  type="radio" name="avatar_emoji" value={e}
                  defaultChecked={(profile?.avatar_emoji ?? "🦊") === e}
                  className="peer hidden"
                />
                <span className="block w-11 h-11 rounded-xl border border-border bg-panel2 text-2xl flex items-center justify-center peer-checked:border-accent peer-checked:bg-accent/10">
                  {e}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-muted">Username (lowercase, a–z, 0–9, _)</label>
          <input name="username" required defaultValue={profile?.username} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" className="mt-1" />
        </div>
        <div>
          <label className="text-sm text-muted">Display name (optional)</label>
          <input name="display_name" defaultValue={profile?.display_name ?? ""} maxLength={48} className="mt-1" />
        </div>
        <button className="btn btn-primary w-full">Save</button>
      </form>

      <p className="text-muted text-xs">
        Active habits: {habitCount ?? 0} · <Link href="/habits" className="underline">manage</Link>
      </p>

      <form action={signOut}>
        <button className="btn btn-ghost w-full">Sign out</button>
      </form>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="card !p-3 text-center">
      <div className="text-xl">{icon}</div>
      <div className="font-black mt-0.5">{value}</div>
      <div className="text-muted text-[10px] uppercase tracking-wider">{label}</div>
    </div>
  );
}
