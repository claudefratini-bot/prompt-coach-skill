import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { respondToChallenge, settleChallenge } from "@/app/actions/challenges";
import { cn, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ChRow = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  title: string;
  emoji: string;
  duration_days: number;
  stake_xp: number;
  status: string;
  winner_id: string | null;
  challenger_score: number;
  opponent_score: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  challenger: { id: string; username: string; avatar_emoji: string | null } | null;
  opponent: { id: string; username: string; avatar_emoji: string | null } | null;
};

export default async function ChallengesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("challenges")
    .select(`
      id, challenger_id, opponent_id, title, emoji, duration_days, stake_xp,
      status, winner_id, challenger_score, opponent_score, starts_at, ends_at, created_at,
      challenger:profiles!challenges_challenger_id_fkey(id, username, avatar_emoji),
      opponent:profiles!challenges_opponent_id_fkey(id, username, avatar_emoji)
    `)
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const all = (rows ?? []) as unknown as ChRow[];
  const incoming = all.filter((c) => c.status === "pending" && c.opponent_id === user.id);
  const active = all.filter((c) => c.status === "active");
  const past = all.filter((c) => c.status === "completed" || c.status === "declined" || c.status === "cancelled");
  const pendingOut = all.filter((c) => c.status === "pending" && c.challenger_id === user.id);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Battles</h1>
        <Link href="/challenges/new" className="btn btn-primary !py-2 !px-3 text-sm">⚔️ New</Link>
      </div>

      {incoming.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted mb-2">Incoming</h2>
          <div className="space-y-2">
            {incoming.map((c) => (
              <div key={c.id} className="card">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{c.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{c.title}</div>
                    <div className="text-muted text-xs">
                      @{c.challenger?.username} · {c.duration_days}d · stakes ⚡ {c.stake_xp}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <form action={respondToChallenge} className="flex-1">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="accept" value="true" />
                    <button className="btn btn-primary w-full">Accept ⚔️</button>
                  </form>
                  <form action={respondToChallenge} className="flex-1">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="accept" value="false" />
                    <button className="btn btn-ghost w-full">Chicken out</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pendingOut.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted mb-2">Waiting on them</h2>
          <div className="space-y-2">
            {pendingOut.map((c) => (
              <div key={c.id} className="card flex items-center gap-3">
                <div className="text-2xl">{c.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{c.title}</div>
                  <div className="text-muted text-xs">vs @{c.opponent?.username} · stakes ⚡ {c.stake_xp}</div>
                </div>
                <span className="chip text-muted">pending</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wider text-muted mb-2">Active</h2>
        {active.length === 0 ? (
          <div className="card text-center py-6">
            <div className="text-3xl mb-1">⚔️</div>
            <div className="text-muted text-sm mb-3">No active battles.</div>
            <Link href="/challenges/new" className="btn btn-primary inline-flex">Challenge a friend</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((c) => {
              const me = c.challenger_id === user.id ? c.challenger! : c.opponent!;
              const them = c.challenger_id === user.id ? c.opponent! : c.challenger!;
              const ends = c.ends_at ? new Date(c.ends_at) : null;
              const expired = ends ? ends < new Date() : false;
              return (
                <div key={c.id} className="card">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{c.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{c.title}</div>
                      <div className="text-muted text-xs">
                        ⚡ {c.stake_xp} on the line ·
                        {ends && (expired ? " ended" : ` ends in ${Math.ceil((ends.getTime() - Date.now()) / 86400000)}d`)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-around mt-3 gap-3">
                    <Side emoji={me.avatar_emoji ?? "🦊"} name={`@${me.username}`} side="you" />
                    <div className="text-2xl font-black text-muted">VS</div>
                    <Side emoji={them.avatar_emoji ?? "🦊"} name={`@${them.username}`} side="them" />
                  </div>
                  {expired && (
                    <form action={settleChallenge} className="mt-3">
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn btn-primary w-full">Settle battle ⚖️</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted mb-2">History</h2>
          <div className="space-y-2">
            {past.map((c) => {
              const won = c.winner_id === user.id;
              const tie = c.status === "completed" && !c.winner_id;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "card flex items-center gap-3",
                    c.status === "completed" && (won ? "border-win/40" : tie ? "" : "border-loss/30"),
                  )}
                >
                  <div className="text-2xl">{c.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{c.title}</div>
                    <div className="text-muted text-xs">
                      vs @{(c.challenger_id === user.id ? c.opponent : c.challenger)?.username} · {timeAgo(c.created_at)}
                    </div>
                  </div>
                  <div className={cn(
                    "chip font-bold",
                    c.status !== "completed" ? "text-muted" :
                      won ? "!bg-win/15 !border-win/40 text-win" :
                      tie ? "" : "!bg-loss/15 !border-loss/40 text-loss",
                  )}>
                    {c.status === "completed"
                      ? (tie ? "TIE" : won ? `+${c.stake_xp}` : `-${c.stake_xp}`)
                      : c.status}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Side({ emoji, name, side }: { emoji: string; name: string; side: "you" | "them" }) {
  return (
    <div className="text-center">
      <div className="text-3xl">{emoji}</div>
      <div className="font-bold text-sm mt-1">{name}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{side}</div>
    </div>
  );
}
