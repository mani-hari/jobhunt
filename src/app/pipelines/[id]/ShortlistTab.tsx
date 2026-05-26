"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { ShortlistCard } from "./ShortlistCard";

type Pipeline = {
  id: string;
  name: string;
  autoApply: boolean;
  autoApplyTimes: string[];
  _count: { search: number; shortlist: number };
};

type PipelineJob = {
  id: string;
  stage: string;
  assetStatus: string;
  shortlistedAt: string | null;
  shortlistedHow: string | null;
  generatedResume: string | null;
  generatedCover: string | null;
  fitSummary: string | null;
  applyStatus: string | null;
  applyError: string | null;
  appliedAt: string | null;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    source: string;
    score: number | null;
    autoApplyEligible: boolean;
    sourceUrl: string;
  };
};

const TIME_SLOTS = [
  { value: "08:00", label: "8:00 AM  Toronto (ET)" },
  { value: "12:00", label: "12:00 PM Toronto (ET)" },
  { value: "17:00", label: "5:00 PM  Toronto (ET)" },
];

export function ShortlistTab({ pipeline }: { pipeline: Pipeline }) {
  const qc = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);

  const generatingRef = useRef<Set<string>>(new Set());

  const { data: jobs = [], isLoading } = useQuery<PipelineJob[]>({
    queryKey: ["pipeline-jobs", pipeline.id, "shortlist"],
    queryFn: () =>
      fetch(`/api/pipelines/${pipeline.id}/jobs?stage=shortlist`).then((r) => r.json()),
    refetchInterval: 8_000,
  });

  // Auto-trigger generation for pending jobs
  useEffect(() => {
    const pending = jobs.filter(
      (j) => j.assetStatus === "pending" && !generatingRef.current.has(j.id)
    );
    for (const pj of pending) {
      generatingRef.current.add(pj.id);
      fetch(`/api/pipelines/${pipeline.id}/jobs/${pj.id}/generate`, { method: "POST" })
        .then(() => qc.invalidateQueries({ queryKey: ["pipeline-jobs", pipeline.id] }))
        .catch(() => generatingRef.current.delete(pj.id));
    }
  }, [jobs, pipeline.id, qc]);

  const patchPipeline = useMutation({
    mutationFn: (data: Partial<Pipeline>) =>
      fetch(`/api/pipelines/${pipeline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline", pipeline.id] });
      qc.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });

  const toggleTime = (slot: string) => {
    const current = pipeline.autoApplyTimes ?? [];
    const next = current.includes(slot)
      ? current.filter((t) => t !== slot)
      : [...current, slot];
    patchPipeline.mutate({ autoApplyTimes: next });
  };

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-start justify-between mb-6">
        <p className="text-sm text-[var(--text-secondary)]">
          {jobs.length} shortlisted
        </p>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Auto-apply eligible</span>
            <button
              onClick={() => {
                patchPipeline.mutate({ autoApply: !pipeline.autoApply });
                if (!pipeline.autoApply) setShowSchedule(true);
                else setShowSchedule(false);
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                pipeline.autoApply ? "bg-[var(--accent-teal)]" : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  pipeline.autoApply ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {(pipeline.autoApply || showSchedule) && (
            <div className="border border-[var(--border)] rounded-lg p-3 bg-white text-xs">
              <p className="font-medium text-[var(--text-primary)] mb-2">Apply daily at:</p>
              {TIME_SLOTS.map((slot) => (
                <label key={slot.value} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(pipeline.autoApplyTimes ?? []).includes(slot.value)}
                    onChange={() => toggleTime(slot.value)}
                    className="w-3.5 h-3.5 accent-[var(--accent-teal)]"
                  />
                  <span className="font-mono text-[var(--text-secondary)]">{slot.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-[var(--bg-primary)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
          <p className="text-sm text-[var(--text-muted)]">No shortlisted jobs yet.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Go to Job Search and click &ldquo;Shortlist&rdquo; on a job to add it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((pj) => (
            <ShortlistCard
              key={pj.id}
              pipelineJob={pj}
              pipelineId={pipeline.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
