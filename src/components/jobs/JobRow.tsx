"use client";

import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { ScoreBar } from "./ScoreBar";
import { companyBlurb } from "@/lib/companyBlurb";
import { formatSalary, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Job } from "./types";

interface Props {
  job: Job;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onShortlist?: () => void;
  onRemove?: () => void;
  onGenerate?: () => void;
  onApply?: () => void;
  generating?: boolean;
}

export function JobRow({
  job,
  selected,
  onToggleSelect,
  onView,
  onShortlist,
  onRemove,
  onGenerate,
  onApply,
  generating,
}: Props) {
  const blurb = companyBlurb(job.description, job.company);
  const isShortlisted = job.status !== "discovered";
  const isApplied = job.appliedAt != null;

  return (
    <div
      className={cn(
        "rounded-xl border bg-bg-card shadow-card transition hover:shadow-card-hover",
        selected ? "border-accent-blue ring-2 ring-accent-blue/30" : "border-line"
      )}
    >
      <div className="p-5 flex flex-col md:flex-row gap-5">
        <div className="flex md:flex-col items-start gap-3 md:gap-4 md:w-12 shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1 h-4 w-4 rounded border-line accent-accent-blue"
            aria-label="Select job"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <button onClick={onView} className="text-left w-full">
                <h3 className="font-serif text-lg font-semibold text-ink-primary leading-snug">
                  {job.title}
                </h3>
              </button>
              <div className="text-sm text-ink-secondary mt-0.5">
                <span className="font-medium text-ink-primary">{job.company}</span>
                <span className="text-ink-muted"> · </span>
                {job.location}
              </div>
            </div>
            <div className="w-full md:w-44 shrink-0">
              <ScoreBar score={job.score} summary={null} />
            </div>
          </div>

          {blurb ? (
            <p className="mt-2 text-sm text-ink-secondary leading-relaxed line-clamp-2">
              <span className="text-ink-muted">About {job.company}: </span>
              {blurb}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
            {job.jobType ? <Tag tone="blue">{job.jobType}</Tag> : null}
            {job.employment ? <Tag>{job.employment}</Tag> : null}
            {job.industry ? <Tag>{job.industry}</Tag> : null}
            <Tag>{job.source}</Tag>
            {formatSalary(job.salaryMin, job.salaryMax) ? (
              <Tag tone="green">{formatSalary(job.salaryMin, job.salaryMax)}</Tag>
            ) : null}
            <span className="text-ink-muted ml-auto">
              Posted {timeAgo(job.postedAt ?? job.fetchedAt)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onView}>
              View details
            </Button>

            {onShortlist && !isShortlisted ? (
              <Button size="sm" onClick={onShortlist}>
                Add to shortlist ⭐
              </Button>
            ) : null}

            {isShortlisted && !onShortlist ? (
              <Tag tone="green">⭐ Shortlisted</Tag>
            ) : null}

            {onGenerate ? (
              <Button size="sm" onClick={onGenerate} disabled={!!generating}>
                {generating ? "Generating…" : "Generate materials"}
              </Button>
            ) : null}

            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={onApply}>
              <Button size="sm" variant="secondary">
                {isApplied ? "Open posting ↗" : "Apply ↗"}
              </Button>
            </a>

            {onRemove ? (
              <Button size="sm" variant="ghost" onClick={onRemove}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
