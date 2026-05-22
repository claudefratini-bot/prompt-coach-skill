import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { archiveHabit, unarchiveHabit } from "@/app/actions/habits";
import { DIFFICULTY_XP } from "@/lib/xp";
import type { Habit } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: habits } = await supabase
    .from("habits").select("*").eq("user_id", user.id).order("created_at");

  const active = (habits ?? []).filter((h) => !h.archived) as Habit[];
  const archived = (habits ?? []).filter((h) => h.archived) as Habit[];

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Habits</h1>
        <Link href="/habits/new" className="btn btn-primary !py-2 !px-3 text-sm">+ New</Link>
      </div>

      <Section title="Active" items={active} archived={false} />
      {archived.length > 0 && <Section title="Archived" items={archived} archived={true} />}
    </div>
  );
}

function Section({ title, items, archived }: { title: string; items: Habit[]; archived: boolean }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted mb-2">{title}</h2>
      <div className="space-y-2">
        {items.map((h) => (
          <div key={h.id} className="card flex items-center gap-3">
            <div className="text-2xl">{h.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{h.title}</div>
              <div className="text-muted text-xs">
                ⚡ {DIFFICULTY_XP[h.difficulty]} · {h.frequency}
              </div>
            </div>
            <form action={archived ? unarchiveHabit : archiveHabit}>
              <input type="hidden" name="id" value={h.id} />
              <button className="btn btn-ghost !py-1.5 !px-3 text-sm">
                {archived ? "Restore" : "Archive"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
