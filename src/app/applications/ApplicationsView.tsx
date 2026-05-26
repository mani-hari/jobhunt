"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type PipelineJob = {
  id: string;
  pipelineId: string;
  assetStatus: string;
  applyStatus: string | null;
  appliedAt: string | null;
  shortlistedAt: string | null;
  fitSummary: string | null;
  job: {
    title: string;
    company: string;
    location: string;
    score: number | null;
    source: string;
    sourceUrl: string;
  };
  pipeline: { id: string; name: string };
};

function scoreColor(score: number | null): string {
  if (score === null) return "text-[var(--text-muted)]";
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function applyBadge(status: string | null) {
  switch (status) {
    case "applied":
      return <span className="px-2 py-0.5 text-xs rounded bg-[var(--accent-teal-light)] text-[var(--accent-teal)]">Applied</span>;
    case "applying":
      return <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-600">Applying…</span>;
    case "failed":
      return <span className="px-2 py-0.5 text-xs rounded bg-red-50 text-red-600">Failed</span>;
    case "opened":
      return <span className="px-2 py-0.5 text-xs rounded bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]">Opened</span>;
    default:
      return <span className="px-2 py-0.5 text-xs rounded bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]">Shortlisted</span>;
  }
}

export function ApplicationsView() {
  const { data: applications = [], isLoading } = useQuery<PipelineJob[]>({
    queryKey: ["applications"],
    queryFn: () => fetch("/api/applications").then((r) => r.json()),
    refetchInterval: 15_000,
  });

  const grouped = applications.reduce<Record<string, PipelineJob[]>>((acc, pj) => {
    const key = pj.pipeline.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pj);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-6">Applications</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[var(--bg-primary)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
          <p className="text-sm text-[var(--text-muted)]">No applications yet.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Shortlist jobs from your pipelines and apply to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([pipelineName, jobs]) => (
            <div key={pipelineName}>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {pipelineName}
              </p>
              <div className="border border-[var(--border)] rounded-lg bg-white divide-y divide-[var(--border)]">
                {jobs.map((pj) => (
                  <div key={pj.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {pj.job.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {pj.job.company} · {pj.job.location}
                        {pj.appliedAt && (
                          <> · Applied {new Date(pj.appliedAt).toLocaleDateString("en-CA")}</>
                        )}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${scoreColor(pj.job.score)}`}>
                      {pj.job.score ?? "—"}
                    </span>
                    {applyBadge(pj.applyStatus)}
                    <Link
                      href={`/pipelines/${pj.pipeline.id}?tab=shortlist`}
                      className="text-xs text-[var(--accent-blue)] hover:underline shrink-0"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
