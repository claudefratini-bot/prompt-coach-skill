import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HabitCard from "@/components/HabitCard";
import { currentStreak, todayUTC } from "@/lib/streaks";
import type { Habit } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: habits }, { data: completions }, { data: goals }] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", user.id).eq("archived", false).order("created_at"),
    supabase.from("completions").select("habit_id, day, xp_earned").eq("user_id", user.id).order("day", { ascending: false }).limit(500),
    supabase.from("goals").select("*").eq("user_id", user.id).eq("completed", false).order("created_at"),
  ]);

  const allHabits = (habits ?? []) as Habit[];
  const today = todayUTC();
  const byHabit: Record<string, string[]> = {};
  let xpToday = 0;
  for (const c of completions ?? []) {
    const hid = c.habit_id as string;
    (byHabit[hid] ??= []).push(c.day as string);
    if (c.day === today) xpToday += (c.xp_earned as number) ?? 0;
  }

  const totalDone = allHabits.filter((h) => (byHabit[h.id] ?? []).includes(today)).length;
  const totalHabits = allHabits.length;

  return (
    <div className="space-y-5 animate-slide-up">
      <section className="card !p-5 bg-gradient-to-br from-accent/10 to-accent2/5 border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-muted text-xs uppercase tracking-wider">Today</div>
            <div className="text-3xl font-black mt-1">
              {totalDone}<span className="text-muted">/{totalHabits}</span>
            </div>
            <div className="text-muted text-sm">habits stacked</div>
          </div>
          <div className="text-right">
            <div className="text-muted text-xs uppercase tracking-wider">Earned</div>
            <div className="text-3xl font-black text-accent mt-1">+{xpToday}</div>
            <div className="text-muted text-sm">XP today</div>
          </div>
        </div>
        {totalHabits > 0 && (
          <div className="mt-4 h-2 bg-panel2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent2 transition-all"
              style={{ width: `${(totalDone / totalHabits) * 100}%` }}
            />
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Habits</h2>
          <Link href="/habits/new" className="btn btn-ghost !py-1.5 !px-3 text-sm">+ New</Link>
        </div>
        {allHabits.length === 0 ? (
          <div className="card text-center py-10">
            <div className="text-4xl mb-2">🌱</div>
            <div className="font-bold">No habits yet</div>
            <div className="text-muted text-sm mb-4">Start with one. Tiny. Daily.</div>
            <Link href="/habits/new" className="btn btn-primary inline-flex">Add your first habit</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {allHabits.map((h) => {
              const days = byHabit[h.id] ?? [];
              return (
                <HabitCard
                  key={h.id}
                  habit={h}
                  doneToday={days.includes(today)}
                  streak={currentStreak(days)}
                />
              );
            })}
          </div>
        )}
        {allHabits.length > 0 && (
          <Link href="/habits" className="text-muted text-sm mt-3 inline-block">Manage habits →</Link>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Active goals</h2>
          <Link href="/goals" className="btn btn-ghost !py-1.5 !px-3 text-sm">View all</Link>
        </div>
        {(goals ?? []).length === 0 ? (
          <Link href="/goals/new" className="card block text-center py-6 text-muted">
            🎯 No goals yet. Set one →
          </Link>
        ) : (
          <div className="space-y-2">
            {(goals ?? []).slice(0, 3).map((g) => (
              <Link href="/goals" key={g.id} className="card flex items-center gap-3 hover:border-accent/40">
                <div className="text-2xl">{g.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{g.title}</div>
                  {g.target_date && (
                    <div className="text-muted text-xs">by {g.target_date}</div>
                  )}
                </div>
                <div className="chip">⚡ {g.xp_reward}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
