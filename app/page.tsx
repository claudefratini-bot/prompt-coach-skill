import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Landing() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-8 py-16 animate-slide-up">
        <div className="inline-block chip"><span>⚔️</span> Habit Arena · beta</div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          Build habits.<br />
          <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
            Crush your friends.
          </span>
        </h1>
        <p className="text-muted text-lg">
          Track habits with a photo. Stack XP. Climb the leaderboard.
          Challenge a friend 1v1 with XP on the line.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/login" className="btn btn-primary">Start playing</Link>
          <Link href="/auth/login" className="btn btn-ghost">I already have an account</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-8 text-left">
          <Feature emoji="📸" label="Photo proof" desc="Every habit done = one snap in your feed." />
          <Feature emoji="⚡" label="XP & levels" desc="Stack XP. Level up. Earn titles." />
          <Feature emoji="⚔️" label="1v1 stakes" desc="Bet XP. Loser ships it to the winner." />
        </div>
      </div>
    </main>
  );
}

function Feature({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="card">
      <div className="text-2xl">{emoji}</div>
      <div className="font-bold mt-1">{label}</div>
      <div className="text-muted text-sm">{desc}</div>
    </div>
  );
}
