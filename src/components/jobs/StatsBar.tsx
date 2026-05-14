"use client";

import { useQuery } from "@tanstack/react-query";

interface Stats {
  total: number;
  lastWeek: number;
  shortlisted: number;
  applied: number;
  strongFits: number;
}

const ITEMS: Array<{ key: keyof Stats; label: string; tone: string }> = [
  { key: "lastWeek", label: "New this week", tone: "text-accent-blue" },
  { key: "strongFits", label: "Strong fits (≥75)", tone: "text-accent-green" },
  { key: "shortlisted", label: "Shortlisted", tone: "text-ink-primary" },
  { key: "applied", label: "Applied / interviewing", tone: "text-accent-amber" },
  { key: "total", label: "Total discovered", tone: "text-ink-secondary" },
];

export function StatsBar() {
  const { data } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const r = await fetch("/api/stats");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {ITEMS.map(({ key, label, tone }) => (
        <div
          key={key}
          className="rounded-xl border border-line bg-bg-card px-4 py-3 shadow-card"
        >
          <div className={`font-serif text-2xl font-semibold ${tone}`}>
            {data ? data[key] : "—"}
          </div>
          <div className="text-xs text-ink-secondary mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
