import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createChallenge } from "@/app/actions/challenges";

export const dynamic = "force-dynamic";

const EMOJIS = ["⚔️", "🥊", "🏆", "🔥", "💀", "👑"];

export default async function NewChallenge() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rels } = await supabase
    .from("friendships")
    .select(`
      requester_id, addressee_id, status,
      requester:profiles!friendships_requester_id_fkey(id, username, avatar_emoji),
      addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_emoji)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  type Rel = {
    requester_id: string; addressee_id: string;
    requester: { id: string; username: string; avatar_emoji: string | null } | null;
    addressee: { id: string; username: string; avatar_emoji: string | null } | null;
  };
  const friends = ((rels ?? []) as unknown as Rel[]).map((r) =>
    r.requester_id === user.id ? r.addressee! : r.requester!,
  );

  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/challenges" className="text-muted text-sm">← back</Link>
      <h1 className="text-2xl font-black">⚔️ New battle</h1>

      {friends.length === 0 ? (
        <div className="card text-center py-8">
          <div className="text-muted text-sm mb-3">You need friends to fight.</div>
          <Link href="/friends" className="btn btn-primary inline-flex">Add friends</Link>
        </div>
      ) : (
        <form action={createChallenge} className="space-y-4">
          <div>
            <label className="text-sm text-muted">Opponent</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {friends.map((f, i) => (
                <label key={f.id} className="cursor-pointer">
                  <input
                    type="radio" name="opponent_id" value={f.id}
                    required defaultChecked={i === 0}
                    className="peer hidden"
                  />
                  <div className="card flex items-center gap-2 !p-3 peer-checked:border-accent peer-checked:bg-accent/10">
                    <div className="text-xl">{f.avatar_emoji ?? "🦊"}</div>
                    <div className="font-bold text-sm truncate">@{f.username}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted">Battle title</label>
            <input name="title" required placeholder="Most workouts this week" className="mt-1" maxLength={80} />
          </div>

          <div>
            <label className="text-sm text-muted">Emoji</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EMOJIS.map((e, i) => (
                <label key={e} className="cursor-pointer">
                  <input type="radio" name="emoji" value={e} defaultChecked={i === 0} className="peer hidden" />
                  <span className="block w-11 h-11 rounded-xl border border-border bg-panel2 text-2xl flex items-center justify-center peer-checked:border-accent peer-checked:bg-accent/10">
                    {e}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted">Duration (days)</label>
              <input name="duration_days" type="number" defaultValue={7} min={1} max={60} className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted">XP at stake</label>
              <input name="stake_xp" type="number" defaultValue={100} min={10} max={5000} step={10} className="mt-1" />
            </div>
          </div>

          <p className="text-muted text-xs">
            Whoever logs more habit completions during the window wins. Loser ships ⚡ to winner.
          </p>

          <button className="btn btn-primary w-full">⚔️ Send the challenge</button>
        </form>
      )}
    </div>
  );
}
