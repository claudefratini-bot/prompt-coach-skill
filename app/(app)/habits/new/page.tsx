import Link from "next/link";
import { createHabit } from "@/app/actions/habits";
import { DIFFICULTY_XP } from "@/lib/xp";

const SUGGESTED = ["💪", "🏃", "📚", "🧘", "💧", "🥗", "💤", "✍️", "🎸", "🧠", "🎨", "🚴", "🧹", "📵"];

export default function NewHabit() {
  return (
    <div className="space-y-4 animate-slide-up">
      <Link href="/dashboard" className="text-muted text-sm">← back</Link>
      <h1 className="text-2xl font-black">New habit</h1>

      <form action={createHabit} className="space-y-4">
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
          <label className="text-sm text-muted">What&apos;s the habit?</label>
          <input name="title" required placeholder="e.g. Run 20 minutes" className="mt-1" maxLength={80} />
        </div>

        <div>
          <label className="text-sm text-muted">Difficulty (= XP per completion)</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <label key={d} className="cursor-pointer">
                <input
                  type="radio" name="difficulty" value={d}
                  defaultChecked={d === "medium"}
                  className="peer hidden"
                />
                <div className="card text-center !p-3 peer-checked:border-accent peer-checked:bg-accent/10">
                  <div className="font-bold capitalize">{d}</div>
                  <div className="text-accent text-sm">+{DIFFICULTY_XP[d]} XP</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted">Frequency</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(["daily", "weekdays", "weekly"] as const).map((f) => (
              <label key={f} className="cursor-pointer">
                <input
                  type="radio" name="frequency" value={f}
                  defaultChecked={f === "daily"}
                  className="peer hidden"
                />
                <div className="card text-center !p-3 peer-checked:border-accent peer-checked:bg-accent/10">
                  <div className="font-bold capitalize text-sm">{f}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary w-full">Create habit</button>
      </form>
    </div>
  );
}
