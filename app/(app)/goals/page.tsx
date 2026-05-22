import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { completeGoal, deleteGoal } from "@/app/actions/goals";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: goals } = await supabase
    .from("goals").select("*").eq("user_id", user.id).order("completed").order("created_at", { ascending: false });

  const active = (goals ?? []).filter((g) => !g.completed);
  const done = (goals ?? []).filter((g) => g.completed);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Goals</h1>
        <Link href="/goals/new" className="btn btn-primary !py-2 !px-3 text-sm">+ New</Link>
      </div>

      {active.length === 0 && done.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-2">🎯</div>
          <div className="font-bold">No goals yet</div>
          <div className="text-muted text-sm mb-4">Goals = bigger XP payouts.</div>
          <Link href="/goals/new" className="btn btn-primary inline-flex">Set a goal</Link>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted mb-2">In progress</h2>
          <div className="space-y-2">
            {active.map((g) => (
              <div key={g.id} className="card flex items-center gap-3">
                <div className="text-2xl">{g.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{g.title}</div>
                  {g.target_date && (
                    <div className="text-muted text-xs">by {g.target_date}</div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="chip">⚡ {g.xp_reward}</div>
                  <form action={completeGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <button className="btn btn-primary !py-1.5 !px-3 text-sm">Claim</button>
                  </form>
                  <form action={deleteGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <button className="btn btn-ghost !py-1.5 !px-2 text-sm" aria-label="Delete">✕</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted mb-2">Crushed</h2>
          <div className="space-y-2">
            {done.map((g) => (
              <div key={g.id} className="card flex items-center gap-3 opacity-70">
                <div className="text-2xl">{g.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold line-through truncate">{g.title}</div>
                  <div className="text-win text-xs">✓ claimed +{g.xp_reward} XP</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
