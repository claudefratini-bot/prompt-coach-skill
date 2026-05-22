"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard",   label: "Today",   icon: "🎯" },
  { href: "/feed",        label: "Feed",    icon: "📸" },
  { href: "/leaderboard", label: "Ranks",   icon: "🏆" },
  { href: "/challenges",  label: "Battles", icon: "⚔️" },
  { href: "/friends",     label: "Friends", icon: "👥" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-bg/85 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto px-2 grid grid-cols-5">
        {tabs.map((t) => {
          const active = path === t.href || path.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs",
                active ? "text-ink" : "text-muted",
              )}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className={cn("font-semibold", active && "text-accent")}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
