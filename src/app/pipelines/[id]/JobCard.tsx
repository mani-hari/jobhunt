"use client";

import { PLATFORMS, PlatformKey } from "@/lib/types";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  jobType: string | null;
  employment: string | null;
  score: number | null;
  scoreSummary: string | null;
  postedAt: string | null;
  autoApplyEligible: boolean;
  sourceUrl: string;
};

type PipelineJob = {
  id: string;
  stage: string;
  assetStatus: string;
  job: Job;
};

type Props = {
  pipelineJob: PipelineJob;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  onShortlist?: () => void;
  showShortlistButton?: boolean;
};

function scoreColor(score: number | null): string {
  if (score === null) return "text-[var(--text-muted)]";
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-[var(--border)]";
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function JobCard({ pipelineJob, selected, onToggle, onView, onShortlist, showShortlistButton }: Props) {
  const { job } = pipelineJob;
  const platformName = PLATFORMS[job.source as PlatformKey]?.name ?? job.source;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
      selected
        ? "border-[var(--accent-blue)] bg-[var(--bg-selected)]"
        : "border-[var(--border)] bg-white hover:border-[var(--accent-blue)]/30"
    }`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-0.5 w-4 h-4 accent-[var(--accent-blue)] shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm text-[var(--text-primary)] truncate">{job.title}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {job.company} · {job.location} · {platformName}
              {job.postedAt && <span> · {timeAgo(job.postedAt)}</span>}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {job.jobType && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {job.jobType}
                </span>
              )}
              {job.employment && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {job.employment}
                </span>
              )}
              {job.autoApplyEligible && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--accent-teal-light)] text-[var(--accent-teal)] font-medium">
                  ⚡ Auto
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0 text-right">
            {job.score !== null ? (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${scoreBg(job.score)}`}
                    style={{ width: `${job.score}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold tabular-nums ${scoreColor(job.score)}`}>
                  {job.score}
                </span>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">—</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={onView}
            className="text-xs text-[var(--accent-blue)] hover:underline"
          >
            View
          </button>
          {showShortlistButton && onShortlist && (
            <button
              onClick={onShortlist}
              className="text-xs px-2 py-0.5 border border-[var(--accent-blue)] text-[var(--accent-blue)] rounded hover:bg-[var(--accent-blue-light)] transition-colors"
            >
              Shortlist
            </button>
          )}
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] ml-auto"
          >
            ↗ Open
          </a>
        </div>
      </div>
    </div>
  );
}
