import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { levelProgress, titleForLevel } from "@/lib/xp";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const p = profile ?? { username: "player", avatar_emoji: "🦊", total_xp: 0, level: 1, display_name: null };
  const prog = levelProgress(p.total_xp);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 backdrop-blur bg-bg/70 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/profile" className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-panel2 border border-border flex items-center justify-center text-xl">
              {p.avatar_emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">
                @{p.username}
                <span className="text-muted font-normal"> · {titleForLevel(prog.level)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip !px-2 !py-0.5 text-[10px]">LVL {prog.level}</span>
                <div className="h-1.5 flex-1 bg-panel2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent2"
                    style={{ width: `${prog.pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted">{prog.into}/{prog.span}</span>
              </div>
            </div>
          </Link>
          <div className="chip !bg-gradient-to-r !from-accent/20 !to-accent2/20 !border-accent/30 text-accent">
            ⚡ {p.total_xp.toLocaleString()}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
