"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

interface JobIdRow {
  id: string;
}

/**
 * Next/Prev navigation on the job detail page.
 *
 * Honors the same filter query string used by the Jobs page so the user can
 * step through their filtered list without leaving the detail view. Falls
 * back to the unfiltered list when no filters are present in the URL.
 */
export function JobNav({ currentId }: { currentId: string }) {
  const sp = useSearchParams();
  const qs = sp.toString();

  const { data = [] } = useQuery<JobIdRow[]>({
    queryKey: ["jobs", "nav", qs],
    queryFn: async () => {
      const r = await fetch(`/api/jobs?${qs}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });

  const idx = data.findIndex((j) => j.id === currentId);
  const prev = idx > 0 ? data[idx - 1] : null;
  const next = idx >= 0 && idx < data.length - 1 ? data[idx + 1] : null;
  const position = idx >= 0 ? `${idx + 1} of ${data.length}` : null;

  const baseClass =
    "inline-flex items-center gap-1 rounded-lg border border-line bg-bg-card px-2.5 py-1.5 text-xs font-medium transition";
  const enabled = "text-ink-secondary hover:text-accent-blue hover:bg-bg-hover";
  const disabled = "text-ink-muted opacity-50 cursor-not-allowed";

  return (
    <div className="flex items-center gap-2">
      {prev ? (
        <Link href={`/jobs/${prev.id}${qs ? `?${qs}` : ""}`} className={`${baseClass} ${enabled}`}>
          ← Previous
        </Link>
      ) : (
        <span className={`${baseClass} ${disabled}`}>← Previous</span>
      )}
      {position ? (
        <span className="text-[11px] uppercase tracking-wide text-ink-muted px-1">{position}</span>
      ) : null}
      {next ? (
        <Link href={`/jobs/${next.id}${qs ? `?${qs}` : ""}`} className={`${baseClass} ${enabled}`}>
          Next →
        </Link>
      ) : (
        <span className={`${baseClass} ${disabled}`}>Next →</span>
      )}
    </div>
  );
}
