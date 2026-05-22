"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendFriendRequest(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!username) throw new Error("username required");

  const { data: target } = await supabase
    .from("profiles").select("id, username").eq("username", username).maybeSingle();
  if (!target) throw new Error("No player with that username");
  if (target.id === user.id) throw new Error("That's you, champ.");

  // If a friendship already exists in either direction, accept it instead.
  const { data: existing } = await supabase
    .from("friendships")
    .select("*")
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") {
      // nothing to do
    } else if (existing.requester_id === target.id) {
      // they had requested -> accept it
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", existing.id);
    }
  } else {
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: target.id, status: "pending" });
    if (error) throw error;
  }

  revalidatePath("/friends");
}

export async function respondToRequest(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const id = String(formData.get("id"));
  const accept = String(formData.get("accept")) === "true";

  if (accept) {
    await supabase.from("friendships")
      .update({ status: "accepted" }).eq("id", id).eq("addressee_id", user.id);
  } else {
    await supabase.from("friendships").delete().eq("id", id).eq("addressee_id", user.id);
  }
  revalidatePath("/friends");
}

export async function removeFriend(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const otherId = String(formData.get("other_id"));
  await supabase.from("friendships").delete()
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${user.id})`);
  revalidatePath("/friends");
  revalidatePath("/leaderboard");
}
