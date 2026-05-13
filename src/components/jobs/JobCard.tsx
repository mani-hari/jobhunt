"use client";

import { Card, CardSection } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { ScoreBar } from "./ScoreBar";
import { timeAgo } from "@/lib/format";
import type { Job } from "./types";

export function JobCard({
  job,
  selected,
  onToggleSelect,
  onView,
  onShortlist,
}: {
  job: Job;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onShortlist: () => void;
}) {
  const isShortlisted = job.status !== "discovered";
  return (
    <Card className={selected ? "ring-2 ring-accent-blue" : undefined}>
      <CardSection className="flex flex-col h-full">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1 h-4 w-4 rounded border-line accent-accent-blue"
            aria-label="Select job"
          />
          <div className="flex-1 min-w-0">
            <button onClick={onView} className="text-left w-full">
              <h3 className="font-serif text-lg font-semibold text-ink-primary leading-snug line-clamp-2">
                {job.title}
              </h3>
            </button>
            <div className="text-sm text-ink-secondary mt-0.5">
              {job.company} · {job.location}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.jobType ? <Tag tone="blue">{job.jobType}</Tag> : null}
          {job.employment ? <Tag>{job.employment}</Tag> : null}
          {job.industry ? <Tag>{job.industry}</Tag> : null}
          <Tag>{job.source}</Tag>
        </div>

        <div className="text-xs text-ink-muted mt-3">
          Posted {timeAgo(job.postedAt ?? job.fetchedAt)}
        </div>

        <p className="text-sm text-ink-secondary mt-3 line-clamp-3">
          {stripHtml(job.description).slice(0, 240)}
          {stripHtml(job.description).length > 240 ? "…" : ""}
        </p>

        <div className="mt-4">
          <ScoreBar score={job.score} summary={job.scoreSummary} />
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onView}>
            View details
          </Button>
          {isShortlisted ? (
            <Tag tone="green">⭐ Shortlisted</Tag>
          ) : (
            <Button size="sm" onClick={onShortlist}>
              Add to shortlist ⭐
            </Button>
          )}
        </div>
      </CardSection>
    </Card>
  );
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
