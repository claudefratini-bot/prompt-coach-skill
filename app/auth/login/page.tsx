"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card max-w-sm w-full p-8 space-y-5 animate-pop">
        <Link href="/" className="text-muted text-sm">← back</Link>
        <div>
          <h1 className="text-2xl font-black">Enter the Arena</h1>
          <p className="text-muted text-sm mt-1">We&apos;ll email you a magic link.</p>
        </div>
        {sent ? (
          <div className="text-win">
            ✓ Check your inbox at <b>{email}</b>.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {err && <div className="text-loss text-sm">{err}</div>}
            <button className="btn btn-primary w-full" disabled={loading || !email}>
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
