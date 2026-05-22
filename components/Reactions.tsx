"use client";

import { useState, useTransition } from "react";
import { reactToCompletion } from "@/app/actions/completions";
import { cn } from "@/lib/utils";

const REACTIONS = ["🔥", "💪", "👑", "🤝", "😤"];

type Props = {
  completionId: string;
  initial: { emoji: string; count: number; mine: boolean }[];
};

export default function Reactions({ completionId, initial }: Props) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();

  function toggle(emoji: string) {
    setItems((prev) => {
      const map = new Map(prev.map((p) => [p.emoji, { ...p }]));
      const cur = map.get(emoji) ?? { emoji, count: 0, mine: false };
      if (cur.mine) { cur.count = Math.max(0, cur.count - 1); cur.mine = false; }
      else { cur.count += 1; cur.mine = true; }
      map.set(emoji, cur);
      return Array.from(map.values());
    });
    start(async () => {
      const fd = new FormData();
      fd.set("completion_id", completionId);
      fd.set("emoji", emoji);
      await reactToCompletion(fd);
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {REACTIONS.map((e) => {
        const it = items.find((i) => i.emoji === e);
        const count = it?.count ?? 0;
        const mine = it?.mine ?? false;
        return (
          <button
            key={e}
            onClick={() => toggle(e)}
            disabled={pending}
            className={cn(
              "px-2.5 py-1 rounded-full border text-sm transition",
              mine
                ? "bg-accent/15 border-accent/40 text-ink"
                : "bg-panel2 border-border text-muted hover:border-accent/30",
            )}
          >
            <span>{e}</span>
            {count > 0 && <span className="ml-1 text-xs font-bold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
