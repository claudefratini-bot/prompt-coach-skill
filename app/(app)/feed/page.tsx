import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Reactions from "@/components/Reactions";
import { photoUrl, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type FeedRow = {
  id: string;
  user_id: string;
  habit_id: string;
  photo_path: string;
  note: string | null;
  xp_earned: number;
  completed_at: string;
  habits: { title: string; emoji: string } | null;
  profiles: { username: string; display_name: string | null; avatar_emoji: string | null } | null;
};

export default async function FeedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: completions } = await supabase
    .from("completions")
    .select(`
      id, user_id, habit_id, photo_path, note, xp_earned, completed_at,
      habits(title, emoji),
      profiles!completions_user_id_fkey(username, display_name, avatar_emoji)
    `)
    .order("completed_at", { ascending: false })
    .limit(60);

  const rows = (completions ?? []) as unknown as FeedRow[];
  const completionIds = rows.map((r) => r.id);

  const { data: reactions } = completionIds.length
    ? await supabase.from("reactions").select("*").in("completion_id", completionIds)
    : { data: [] };

  const rxMap: Record<string, { emoji: string; count: number; mine: boolean }[]> = {};
  for (const r of reactions ?? []) {
    const list = (rxMap[r.completion_id] ??= []);
    const item = list.find((x) => x.emoji === r.emoji);
    if (item) {
      item.count += 1;
      if (r.user_id === user.id) item.mine = true;
    } else {
      list.push({ emoji: r.emoji, count: 1, mine: r.user_id === user.id });
    }
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <h1 className="text-2xl font-black">Feed</h1>

      {rows.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-2">📸</div>
          <div className="font-bold">Empty feed</div>
          <div className="text-muted text-sm mb-4">Complete a habit or add friends.</div>
          <div className="flex gap-2 justify-center">
            <Link href="/dashboard" className="btn btn-primary">Track a habit</Link>
            <Link href="/friends" className="btn btn-ghost">Add friends</Link>
          </div>
        </div>
      ) : (
        rows.map((c) => (
          <article key={c.id} className="card !p-0 overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full bg-panel2 border border-border flex items-center justify-center text-xl">
                {c.profiles?.avatar_emoji ?? "🦊"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">
                  @{c.profiles?.username ?? "player"}
                  {c.user_id === user.id && (
                    <span className="ml-2 text-[10px] uppercase text-muted">you</span>
                  )}
                </div>
                <div className="text-muted text-xs">
                  {c.habits?.emoji} {c.habits?.title} · {timeAgo(c.completed_at)}
                </div>
              </div>
              <div className="chip !bg-accent/10 !border-accent/30 text-accent">+{c.xp_earned}</div>
            </div>

            <div className="relative w-full aspect-square bg-panel2">
              <Image
                src={photoUrl(c.photo_path)}
                alt={c.habits?.title ?? "habit"}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="p-4">
              {c.note && <div className="text-sm mb-1">{c.note}</div>}
              <Reactions completionId={c.id} initial={rxMap[c.id] ?? []} />
            </div>
          </article>
        ))
      )}
    </div>
  );
}
