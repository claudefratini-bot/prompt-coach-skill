"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createGoal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const title = String(formData.get("title") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "🎯") || "🎯";
  const targetDate = (formData.get("target_date") as string) || null;
  const xp = Number(formData.get("xp_reward") ?? 250);
  if (!title) throw new Error("title required");

  await supabase.from("goals").insert({
    user_id: user.id, title, emoji, target_date: targetDate, xp_reward: xp,
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  redirect("/goals");
}

export async function completeGoal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const id = String(formData.get("id"));
  const { data: goal } = await supabase
    .from("goals").select("*").eq("id", id).eq("user_id", user.id).single();
  if (!goal || goal.completed) return;

  // XP is awarded by the DB trigger when completed flips to true.
  await supabase.from("goals").update({
    completed: true, completed_at: new Date().toISOString(),
  }).eq("id", id);

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/feed");
}

export async function deleteGoal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const id = String(formData.get("id"));
  await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/goals");
}
