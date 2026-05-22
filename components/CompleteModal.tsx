"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { completeHabit } from "@/app/actions/completions";

type Props = {
  habitId: string;
  habitTitle: string;
  habitEmoji: string;
  onClose: () => void;
};

export default function CompleteModal({ habitId, habitTitle, habitEmoji, onClose }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ xp: number; streak: number } | null>(null);

  function pick(f: File | null) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file) { setErr("Add a photo first."); return; }
    setLoading(true); setErr(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not authed");

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${habitId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("habit-photos")
        .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
      if (upErr) throw upErr;

      const fd = new FormData();
      fd.set("habit_id", habitId);
      fd.set("photo_path", path);
      if (note) fd.set("note", note);

      const res = await completeHabit(fd);
      setSuccess(res);
      setTimeout(() => { onClose(); router.refresh(); }, 1400);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-muted text-xs">Snap it to ship it</div>
            <div className="text-lg font-bold">{habitEmoji} {habitTitle}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost !p-2 !rounded-full" aria-label="Close">✕</button>
        </div>

        {success ? (
          <div className="text-center py-10 animate-pop">
            <div className="text-6xl mb-2">🔥</div>
            <div className="text-2xl font-black">+{success.xp} XP</div>
            <div className="text-muted mt-1">{success.streak}-day streak</div>
          </div>
        ) : (
          <>
            <div
              className="aspect-square w-full rounded-2xl border border-border bg-panel2 overflow-hidden flex items-center justify-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="proof" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted px-6">
                  <div className="text-5xl mb-2">📸</div>
                  <div className="font-semibold">Tap to capture proof</div>
                  <div className="text-xs">Photo posts to your feed</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />

            <textarea
              placeholder="Optional brag (140 chars)"
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-3 resize-none"
              rows={2}
            />

            {err && <div className="text-loss text-sm mt-2">{err}</div>}

            <div className="flex gap-2 mt-3">
              <button onClick={onClose} className="btn btn-ghost flex-1" disabled={loading}>Cancel</button>
              <button onClick={submit} className="btn btn-primary flex-1" disabled={loading || !file}>
                {loading ? "Posting..." : "Mark done"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
