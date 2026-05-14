"use client";

import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ScoreBar } from "./ScoreBar";
import { formatSalary, timeAgo } from "@/lib/format";
import type { Job } from "./types";

export function JobDetail({
  job,
  onClose,
  onShortlist,
}: {
  job: Job | null;
  onClose: () => void;
  onShortlist?: (id: string) => void;
}) {
  return (
    <SlideOver
      open={!!job}
      onClose={onClose}
      title={job?.title ?? ""}
      footer={
        job ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-ink-muted">Source: {job.source}</div>
            <div className="flex gap-2">
              {job.status === "discovered" && onShortlist ? (
                <Button onClick={() => onShortlist(job.id)}>Add to shortlist ⭐</Button>
              ) : null}
              <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">Open posting ↗</Button>
              </a>
            </div>
          </div>
        ) : null
      }
    >
      {job ? (
        <div className="px-6 py-5 space-y-5">
          <div>
            <div className="text-sm text-ink-secondary">{job.company} · {job.location}</div>
            <div className="text-xs text-ink-muted mt-0.5">
              Posted {timeAgo(job.postedAt ?? job.fetchedAt)}
              {formatSalary(job.salaryMin, job.salaryMax)
                ? ` · ${formatSalary(job.salaryMin, job.salaryMax)}`
                : ""}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {job.jobType ? <Tag tone="blue">{job.jobType}</Tag> : null}
              {job.employment ? <Tag>{job.employment}</Tag> : null}
              {job.industry ? <Tag>{job.industry}</Tag> : null}
            </div>
          </div>

          <div>
            <ScoreBar score={job.score} summary={job.scoreSummary} />
            <ScoreBreakdown raw={job.scoreDetails} />
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold text-ink-primary mb-2">Description</h3>
            <div className="prose-body text-sm whitespace-pre-wrap">
              {stripHtml(job.description)}
            </div>
          </div>
        </div>
      ) : null}
    </SlideOver>
  );
}

function ScoreBreakdown({ raw }: { raw: string | null }) {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { strengths?: string[]; gaps?: string[]; tip?: string };
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        {d.strengths?.length ? (
          <div className="rounded-lg border border-line p-3 bg-bg-primary">
            <div className="text-xs font-semibold text-accent-green uppercase tracking-wide">Strengths</div>
            <ul className="mt-1 space-y-1 text-xs text-ink-secondary list-disc pl-4">
              {d.strengths.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        ) : null}
        {d.gaps?.length ? (
          <div className="rounded-lg border border-line p-3 bg-bg-primary">
            <div className="text-xs font-semibold text-accent-amber uppercase tracking-wide">Gaps</div>
            <ul className="mt-1 space-y-1 text-xs text-ink-secondary list-disc pl-4">
              {d.gaps.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        ) : null}
        {d.tip ? (
          <div className="sm:col-span-2 rounded-lg border border-line p-3 bg-accent-blue-light/40">
            <div className="text-xs font-semibold text-accent-blue uppercase tracking-wide">Tip</div>
            <p className="text-xs text-ink-secondary mt-1">{d.tip}</p>
          </div>
        ) : null}
      </div>
    );
  } catch {
    return null;
  }
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}
