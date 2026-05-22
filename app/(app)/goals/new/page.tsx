import Link from "next/link";
import { createGoal } from "@/app/actions/goals";

const SUGGESTED = ["🎯", "🏆", "🚀", "💎", "👑", "🔥", "💼", "🎓", "🏝️", "💪"];

export default function NewGoal() {
  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/goals" className="text-muted text-sm">← back</Link>
      <h1 className="text-2xl font-black">New goal</h1>

      <form action={createGoal} className="space-y-4">
        <div>
          <label className="text-sm text-muted">Emoji</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SUGGESTED.map((e, i) => (
              <label key={e} className="cursor-pointer">
                <input
                  type="radio" name="emoji" value={e}
                  defaultChecked={i === 0}
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
          <label className="text-sm text-muted">Goal</label>
          <input name="title" required placeholder="e.g. Read 10 books this year" className="mt-1" maxLength={120} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted">Target date (optional)</label>
            <input name="target_date" type="date" className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted">XP reward</label>
            <input name="xp_reward" type="number" defaultValue={250} min={50} max={5000} step={50} className="mt-1" />
          </div>
        </div>

        <button className="btn btn-primary w-full">Set goal</button>
      </form>
    </div>
  );
}
