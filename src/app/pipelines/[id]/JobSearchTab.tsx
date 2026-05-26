"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { JobCard } from "./JobCard";
import { JobDescriptionSlideOver } from "./JobDescriptionSlideOver";

type Pipeline = {
  id: string;
  lastFetchedAt: string | null;
  fetchLimit: number;
  autoShortlist: boolean;
  _count: { search: number; shortlist: number };
};

type PipelineJob = {
  id: string;
  stage: string;
  assetStatus: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    jobType: string | null;
    employment: string | null;
    source: string;
    score: number | null;
    scoreSummary: string | null;
    postedAt: string | null;
    autoApplyEligible: boolean;
    sourceUrl: string;
  };
};

type FetchResult = { fetched: number; scored: number; errors: number; elapsed: string };

export function JobSearchTab({ pipeline }: { pipeline: Pipeline }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scoreMin, setScoreMin] = useState(0);
  const [jobType, setJobType] = useState("");
  const [viewingJob, setViewingJob] = useState<PipelineJob["job"] | null>(null);
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);

  const params = new URLSearchParams({ stage: "search" });
  if (scoreMin > 0) params.set("scoreMin", String(scoreMin));
  if (jobType) params.set("jobType", jobType);

  const { data: jobs = [], isLoading } = useQuery<PipelineJob[]>({
    queryKey: ["pipeline-jobs", pipeline.id, "search", scoreMin, jobType],
    queryFn: () => fetch(`/api/pipelines/${pipeline.id}/jobs?${params}`).then((r) => r.json()),
  });

  const fetchMut = useMutation({
    mutationFn: () =>
      fetch(`/api/pipelines/${pipeline.id}/fetch`, { method: "POST" }).then((r) => r.json()),
    onSuccess: (data: FetchResult) => {
      setFetchResult(data);
      qc.invalidateQueries({ queryKey: ["pipeline-jobs", pipeline.id] });
      qc.invalidateQueries({ queryKey: ["pipeline", pipeline.id] });
      qc.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });

  const shortlistMut = useMutation({
    mutationFn: (jobIds: string[]) =>
      fetch(`/api/pipelines/${pipeline.id}/jobs/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["pipeline-jobs", pipeline.id] });
      qc.invalidateQueries({ queryKey: ["pipeline", pipeline.id] });
      qc.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });

  const autoShortlistMut = useMutation({
    mutationFn: (autoShortlist: boolean) =>
      fetch(`/api/pipelines/${pipeline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoShortlist }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline", pipeline.id] }),
  });

  const toggleSelect = (jobId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });

  const lastFetched = pipeline.lastFetchedAt
    ? timeAgo(new Date(pipeline.lastFetchedAt))
    : "never";

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <button
          onClick={() => fetchMut.mutate()}
          disabled={fetchMut.isPending}
          className="px-4 py-2 text-sm font-medium bg-[var(--accent-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {fetchMut.isPending ? "Fetching…" : "Fetch Jobs"}
        </button>
        <span className="text-xs text-[var(--text-muted)]">
          {fetchMut.isPending ? "Scraping all platforms…" : `Last fetched: ${lastFetched}`}
        </span>
        {fetchResult && !fetchMut.isPending && (
          <span className="text-xs text-[var(--accent-teal)]">
            {fetchResult.fetched} new jobs · {fetchResult.scored} scored · {fetchResult.elapsed}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Auto-shortlist eligible</span>
          <button
            onClick={() => autoShortlistMut.mutate(!pipeline.autoShortlist)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              pipeline.autoShortlist ? "bg-[var(--accent-teal)]" : "bg-[var(--border)]"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                pipeline.autoShortlist ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={scoreMin}
          onChange={(e) => setScoreMin(Number(e.target.value))}
          className="text-xs border border-[var(--border)] rounded-md px-2 py-1.5 bg-white text-[var(--text-secondary)]"
        >
          <option value={0}>All scores</option>
          <option value={75}>Score ≥75</option>
          <option value={50}>Score ≥50</option>
        </select>
        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="text-xs border border-[var(--border)] rounded-md px-2 py-1.5 bg-white text-[var(--text-secondary)]"
        >
          <option value="">All types</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-[var(--bg-selected)] rounded-md">
          <span className="text-sm font-medium text-[var(--accent-blue)]">
            {selected.size} selected
          </span>
          <button
            onClick={() => shortlistMut.mutate(Array.from(selected))}
            disabled={shortlistMut.isPending}
            className="text-sm px-3 py-1 bg-[var(--accent-blue)] text-white rounded hover:opacity-90 disabled:opacity-50"
          >
            {shortlistMut.isPending ? "Moving…" : "Add to Shortlist"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--bg-primary)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
          <p className="text-sm text-[var(--text-muted)]">No jobs yet.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Click &ldquo;Fetch Jobs&rdquo; to search all selected platforms.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((pj) => (
            <JobCard
              key={pj.id}
              pipelineJob={pj}
              selected={selected.has(pj.job.id)}
              onToggle={() => toggleSelect(pj.job.id)}
              onView={() => setViewingJob(pj.job)}
              onShortlist={() => shortlistMut.mutate([pj.job.id])}
              showShortlistButton
            />
          ))}
        </div>
      )}

      {viewingJob && (
        <JobDescriptionSlideOver
          job={viewingJob}
          onClose={() => setViewingJob(null)}
        />
      )}
    </div>
  );
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
