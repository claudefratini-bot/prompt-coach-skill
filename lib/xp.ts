import type { Difficulty } from "./types";

export const DIFFICULTY_XP: Record<Difficulty, number> = {
  easy: 5,
  medium: 12,
  hard: 25,
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

// Cumulative XP required to reach level L = 50 * L * (L - 1)
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2));
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const into = xp - floor;
  const span = ceil - floor;
  return {
    level,
    into,
    span,
    pct: Math.min(100, Math.round((into / span) * 100)),
    toNext: ceil - xp,
  };
}

const TITLES = [
  "Spark",        // 1
  "Apprentice",   // 2
  "Disciplined",  // 3
  "Sharpened",    // 4
  "Relentless",   // 5
  "Beast",        // 6
  "Unstoppable",  // 7
  "Mythic",       // 8
  "Legend",       // 9
  "God-Tier",     // 10+
];

export function titleForLevel(level: number): string {
  return TITLES[Math.min(level - 1, TITLES.length - 1)];
}
