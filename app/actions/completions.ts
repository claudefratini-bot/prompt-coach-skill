"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTY_XP } from "@/lib/xp";
import { streakBonusFor, currentStreak } from "@/lib/streaks";

export async function completeHabit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const habitId = String(formData.get("habit_id"));
  const photoPath = String(formData.get("photo_path"));
  const note = (formData.get("note") as string | null)?.toString().slice(0, 280) || null;

  if (!habitId || !photoPath) throw new Error("missing fields");

  const { data: habit, error: hErr } = await supabase
    .from("habits").select("difficulty").eq("id", habitId).eq("user_id", user.id).single();
  if (hErr || !habit) throw hErr ?? new Error("habit not found");

  const { data: prior } = await supabase
    .from("completions").select("day").eq("habit_id", habitId).order("day", { ascending: false }).limit(120);
  const streakNow = currentStreak((prior ?? []).map((c) => c.day as string)) + 1;
  const baseXp = DIFFICULTY_XP[habit.difficulty as keyof typeof DIFFICULTY_XP] ?? 12;
  const xp = baseXp + streakBonusFor(streakNow);

  // xp_earned is recomputed authoritatively by the DB trigger; sending it here
  // is fine — the trigger overwrites it before insert.
  const { data: row, error: cErr } = await supabase
    .from("completions")
    .insert({ habit_id: habitId, user_id: user.id, photo_path: photoPath, note })
    .select("xp_earned")
    .single();
  if (cErr) {
    if ((cErr as { code?: string }).code === "23505") {
      throw new Error("Already completed today");
    }
    throw cErr;
  }
  const finalXp = (row?.xp_earned as number | undefined) ?? xp;

  revalidatePath("/dashboard");
  revalidatePath("/feed");
  revalidatePath("/leaderboard");
  return { xp: finalXp, streak: streakNow };
}

export async function reactToCompletion(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const completionId = String(formData.get("completion_id"));
  const emoji = String(formData.get("emoji"));

  // Toggle: delete if exists, else insert
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("completion_id", completionId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      completion_id: completionId, user_id: user.id, emoji,
    });
  }
  revalidatePath("/feed");
}
