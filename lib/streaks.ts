// Compute the current streak (consecutive days up to today) from a list of YYYY-MM-DD day strings.
export function currentStreak(days: string[], today = new Date()): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date(today);
  cursor.setUTCHours(0, 0, 0, 0);

  // Allow today to be uncompleted without breaking yesterday's streak.
  if (!set.has(toDay(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (set.has(toDay(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function longestStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const sorted = [...new Set(days)].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    const cur = new Date(sorted[i] + "T00:00:00Z");
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

export function toDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayUTC(): string {
  return toDay(new Date());
}

// Bonus XP for milestone streaks (called on the client just for display
// — DB awards the base XP on insert).
export function streakBonusFor(streak: number): number {
  if (streak >= 100) return 100;
  if (streak >= 30) return 30;
  if (streak >= 7) return 10;
  if (streak >= 3) return 3;
  return 0;
}
