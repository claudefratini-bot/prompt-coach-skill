"use client";

import { useState } from "react";
import CompleteModal from "./CompleteModal";
import { DIFFICULTY_XP } from "@/lib/xp";
import type { Habit } from "@/lib/types";

type Props = {
  habit: Habit;
  doneToday: boolean;
  streak: number;
};

export default function HabitCard({ habit, doneToday, streak }: Props) {
  const [open, setOpen] = useState(false);
  const baseXp = DIFFICULTY_XP[habit.difficulty];

  return (
    <>
      <div className={`card flex items-center gap-3 ${doneToday ? "opacity-60" : ""}`}>
        <div className="text-3xl shrink-0">{habit.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{habit.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="chip !text-[10px] !py-0.5">⚡ {baseXp} XP</span>
            {streak > 0 && (
              <span className="chip !text-[10px] !py-0.5 !bg-gold/10 !border-gold/30 text-gold">
                🔥 {streak}
              </span>
            )}
          </div>
        </div>
        {doneToday ? (
          <div className="chip !bg-win/10 !border-win/30 text-win">✓ Done</div>
        ) : (
          <button onClick={() => setOpen(true)} className="btn btn-primary !py-2 !px-3 text-sm">
            📸 Do it
          </button>
        )}
      </div>
      {open && (
        <CompleteModal
          habitId={habit.id}
          habitTitle={habit.title}
          habitEmoji={habit.emoji}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
