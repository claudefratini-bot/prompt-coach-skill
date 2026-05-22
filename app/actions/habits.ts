"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Difficulty, Frequency } from "@/lib/types";

export async function createHabit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const title = String(formData.get("title") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "⚡").trim() || "⚡";
  const difficulty = (String(formData.get("difficulty") ?? "medium")) as Difficulty;
  const frequency = (String(formData.get("frequency") ?? "daily")) as Frequency;

  if (!title) throw new Error("title required");

  const { error } = await supabase
    .from("habits")
    .insert({ user_id: user.id, title, emoji, difficulty, frequency });
  if (error) throw error;

  revalidatePath("/dashboard");
  revalidatePath("/habits");
  redirect("/dashboard");
}

export async function archiveHabit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const id = String(formData.get("id"));
  await supabase.from("habits").update({ archived: true }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/habits");
}

export async function unarchiveHabit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const id = String(formData.get("id"));
  await supabase.from("habits").update({ archived: false }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}
