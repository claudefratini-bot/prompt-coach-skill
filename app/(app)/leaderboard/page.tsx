import { createClient } from "@/lib/supabase/server";
import { titleForLevel } from "@/lib/xp";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type WeekRow = { user_id: string; xp_earned: number };

export default async function Leaderboard({
  searchParams,
}: { searchParams: { range?: string } }) {
  const range = (searchParams.range === "week" ? "week" : "all") as "week" | "all";

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) Get crew = me + accepted friends
  const { data: rels } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");
  const friendIds = new Set<string>([user.id]);
  for (const r of rels ?? []) {
    friendIds.add(r.requester_id === user.id ? r.addressee_id : r.requester_id);
  }
  const ids = Array.from(friendIds);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_emoji, level, total_xp")
    .in("id", ids);

  let ranked: { id: string; username: string; avatar_emoji: string | null; level: number; xp: number }[] = [];

  if (range === "all") {
    ranked = (profiles ?? []).map((p) => ({
      id: p.id, username: p.username, avatar_emoji: p.avatar_emoji,
      level: p.level, xp: p.total_xp,
    })).sort((a, b) => b.xp - a.xp);
  } else {
    // Sum XP earned in the past 7 days from completions
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: rows } = await supabase
      .from("completions")
      .select("user_id, xp_earned")
      .in("user_id", ids)
      .gte("completed_at", since);

    const sums = new Map<string, number>();
    for (const r of (rows ?? []) as WeekRow[]) {
      sums.set(r.user_id, (sums.get(r.user_id) ?? 0) + r.xp_earned);
    }
    ranked = (profiles ?? []).map((p) => ({
      id: p.id, username: p.username, avatar_emoji: p.avatar_emoji,
      level: p.level, xp: sums.get(p.id) ?? 0,
    })).sort((a, b) => b.xp - a.xp);
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Leaderboard</h1>
      </div>

      <div className="flex gap-2">
        <a
          href="/leaderboard?range=week"
          className={cn("chip", range === "week" && "!bg-accent/15 !border-accent/40 text-ink")}
        >This week</a>
        <a
          href="/leaderboard?range=all"
          className={cn("chip", range === "all" && "!bg-accent/15 !border-accent/40 text-ink")}
        >All-time</a>
      </div>

      <div className="space-y-2">
        {ranked.map((p, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
          const isMe = p.id === user.id;
          return (
            <div
              key={p.id}
              className={cn(
                "card flex items-center gap-3",
                isMe && "border-accent/50 bg-accent/5",
                i === 0 && "ring-1 ring-gold/40",
              )}
            >
              <div className="w-8 text-center font-black text-lg">{medal}</div>
              <div className="w-10 h-10 rounded-full bg-panel2 border border-border flex items-center justify-center text-xl">
                {p.avatar_emoji ?? "🦊"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">
                  @{p.username}{isMe && <span className="text-muted text-xs"> · you</span>}
                </div>
                <div className="text-muted text-xs">LVL {p.level} · {titleForLevel(p.level)}</div>
              </div>
              <div className="chip !bg-accent/10 !border-accent/30 text-accent">
                ⚡ {p.xp.toLocaleString()}
              </div>
            </div>
          );
        })}
        {ranked.length === 1 && (
          <div className="text-center text-muted text-sm py-4">
            Lonely at the top. Add friends to compete →
          </div>
        )}
      </div>
    </div>
  );
}
