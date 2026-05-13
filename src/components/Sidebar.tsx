"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Jobs", icon: "🏠" },
  { href: "/shortlist", label: "Shortlist", icon: "⭐" },
  { href: "/applications", label: "Applications", icon: "📄" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-bg-card sticky top-0 h-screen flex flex-col">
      <div className="px-6 py-7">
        <div className="font-serif text-xl font-semibold text-ink-primary leading-tight">
          ARCS Job Hunter
        </div>
        <div className="text-xs text-ink-muted mt-1">Archana&rsquo;s workspace</div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
                active
                  ? "bg-bg-selected text-accent-blue"
                  : "text-ink-secondary hover:bg-bg-hover hover:text-ink-primary"
              )}
            >
              <span className="text-base" aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-5 border-t border-line text-[11px] text-ink-muted leading-relaxed">
        Tailored for Toronto-based BA / Data roles. Materials prepared by AI — apply via the original posting.
      </div>
    </aside>
  );
}
