"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { AddPipelineModal } from "@/components/pipelines/AddPipelineModal";

type Pipeline = {
  id: string;
  name: string;
  _count: { search: number; shortlist: number };
};

export function Sidebar() {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  const { data: pipelines = [] } = useQuery<Pipeline[]>({
    queryKey: ["pipelines"],
    queryFn: () => fetch("/api/pipelines").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        "block px-3 py-2 text-sm rounded-md transition-colors",
        pathname === href || pathname.startsWith(href + "/")
          ? "bg-[var(--bg-selected)] text-[var(--accent-blue)] font-medium"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-white flex flex-col min-h-screen">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-[var(--border)]">
          <span className="font-serif text-base font-semibold text-[var(--text-primary)] leading-tight">
            Archana
            <br />
            <span className="text-[var(--accent-blue)]">Job Hunter</span>
          </span>
        </div>

        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Add pipeline */}
          <button
            onClick={() => setAddOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue-light)] rounded-md transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add Pipeline
          </button>

          {/* Pipelines */}
          {pipelines.length > 0 && (
            <div>
              <p className="px-3 mb-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Pipelines
              </p>
              <div className="space-y-0.5">
                {pipelines.map((p) => {
                  const active =
                    pathname === `/pipelines/${p.id}` ||
                    pathname.startsWith(`/pipelines/${p.id}/`);
                  const total = p._count.search + p._count.shortlist;
                  return (
                    <Link
                      key={p.id}
                      href={`/pipelines/${p.id}`}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                        active
                          ? "bg-[var(--bg-selected)] text-[var(--accent-blue)] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      {total > 0 && (
                        <span className="ml-2 shrink-0 text-xs text-[var(--text-muted)]">
                          {p._count.shortlist}/{total}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Global nav */}
          <div className="space-y-0.5">
            {navLink("/applications", "Applications")}
            {navLink("/settings", "Settings")}
            {navLink("/logs", "Logs")}
          </div>
        </div>
      </aside>

      <AddPipelineModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
