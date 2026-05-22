"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createChallenge(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const opponentId = String(formData.get("opponent_id"));
  const title = String(formData.get("title") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "⚔️") || "⚔️";
  const days = Math.max(1, Math.min(60, Number(formData.get("duration_days") ?? 7)));
  const stake = Math.max(10, Math.min(5000, Number(formData.get("stake_xp") ?? 100)));

  if (!opponentId || !title) throw new Error("missing fields");

  await supabase.from("challenges").insert({
    challenger_id: user.id,
    opponent_id: opponentId,
    title, emoji,
    duration_days: days,
    stake_xp: stake,
    status: "pending",
  });

  revalidatePath("/challenges");
  redirect("/challenges");
}

export async function respondToChallenge(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const id = String(formData.get("id"));
  const accept = String(formData.get("accept")) === "true";

  const { data: ch } = await supabase
    .from("challenges").select("*").eq("id", id).single();
  if (!ch || ch.opponent_id !== user.id || ch.status !== "pending") return;

  if (!accept) {
    await supabase.from("challenges").update({ status: "declined" }).eq("id", id);
  } else {
    const now = new Date();
    const ends = new Date(now.getTime() + ch.duration_days * 86400000);
    await supabase.from("challenges").update({
      status: "active",
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
    }).eq("id", id);
  }
  revalidatePath("/challenges");
}

// Tally and settle: called when user views the challenges page.
export async function settleChallenge(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authed");

  const id = String(formData.get("id"));
  const { data: ch } = await supabase
    .from("challenges").select("*").eq("id", id).single();
  if (!ch || ch.status !== "active") return;
  if (!ch.ends_at || new Date(ch.ends_at) > new Date()) return;
  if (![ch.challenger_id, ch.opponent_id].includes(user.id)) return;

  // The DB trigger recomputes scores authoritatively + transfers XP on transition
  // to 'completed'. We just flip the status.
  await supabase.from("challenges").update({ status: "completed" }).eq("id", id);

  revalidatePath("/challenges");
  revalidatePath("/leaderboard");
}
