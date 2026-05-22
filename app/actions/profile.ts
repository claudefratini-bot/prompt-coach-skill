"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const username = String(formData.get("username") ?? "").trim().toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  const display = String(formData.get("display_name") ?? "").trim();
  const emoji = String(formData.get("avatar_emoji") ?? "🦊") || "🦊";

  if (!username) throw new Error("username required");
  if (username.length < 3) throw new Error("username too short");

  const update: Record<string, string> = { avatar_emoji: emoji };
  if (display) update.display_name = display;
  update.username = username;

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) throw error;
  revalidatePath("/profile");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
