"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Rows3, BarChart3, Camera } from "lucide-react";
import clsx from "@/lib/clsx";

const TABS = [
  { href: "/", label: "지도", icon: Map },
  { href: "/feed", label: "피드", icon: Rows3 },
] as const;

const TABS_RIGHT = [{ href: "/dashboard", label: "대시보드", icon: BarChart3 }] as const;

function TabLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Map; active: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex-1 flex flex-col items-center justify-center gap-1 h-full",
        active ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
      <span className="text-label">{label}</span>
    </Link>
  );
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[480px] flex items-stretch bg-[var(--surface)] border-t border-[var(--line)]"
      style={{ height: "var(--tabbar-height)", paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      {TABS.map((tab) => (
        <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
      ))}

      <div className="flex-1 flex items-start justify-center relative">
        <Link
          href="/capture"
          aria-label="촬영"
          className="absolute -top-[32px] w-[60px] h-[60px] rounded-full flex items-center justify-center bg-[var(--accent)] border-4 border-[var(--bg)]"
          style={{ boxShadow: "var(--shadow-fab)" }}
        >
          <Camera size={24} color="var(--on-accent)" strokeWidth={2} />
        </Link>
      </div>

      {TABS_RIGHT.map((tab) => (
        <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
      ))}
    </nav>
  );
}
