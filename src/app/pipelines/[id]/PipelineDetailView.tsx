"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobSearchTab } from "./JobSearchTab";
import { ShortlistTab } from "./ShortlistTab";
import { EditPipelineForm } from "./EditPipelineForm";
import { PLATFORMS, PlatformKey } from "@/lib/types";

type Pipeline = {
  id: string;
  name: string;
  keyword: string;
  canonicalTitles: string[];
  platforms: string[];
  autoShortlist: boolean;
  autoApply: boolean;
  autoApplyTimes: string[];
  fetchLimit: number;
  lastFetchedAt: string | null;
  createdAt: string;
  _count: { search: number; shortlist: number };
};

type Props = { pipelineId: string };

export function PipelineDetailView({ pipelineId }: Props) {
  const qc = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<"search" | "shortlist">("search");
  const [editing, setEditing] = useState(false);

  const { data: pipeline, isLoading } = useQuery<Pipeline>({
    queryKey: ["pipeline", pipelineId],
    queryFn: () => fetch(`/api/pipelines/${pipelineId}`).then((r) => r.json()),
  });

  const deleteMut = useMutation({
    mutationFn: () => fetch(`/api/pipelines/${pipelineId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipelines"] });
      router.push("/pipelines");
    },
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-[var(--text-muted)]">Loading…</div>;
  }

  if (!pipeline || (pipeline as { error?: string }).error) {
    return <div className="p-6 text-sm text-[var(--text-muted)]">Pipeline not found.</div>;
  }

  const platformNames = (pipeline.platforms as PlatformKey[])
    .map((k) => PLATFORMS[k]?.name ?? k)
    .join(", ");

  const createdDate = new Date(pipeline.createdAt).toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
        {editing ? (
          <EditPipelineForm
            pipeline={pipeline}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              qc.invalidateQueries({ queryKey: ["pipeline", pipelineId] });
              qc.invalidateQueries({ queryKey: ["pipelines"] });
            }}
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl text-[var(--text-primary)]">{pipeline.name}</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {[pipeline.keyword, ...pipeline.canonicalTitles].join(", ")}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {platformNames} · Created {createdDate}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-[var(--accent-blue)] hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete pipeline '${pipeline.name}'? This removes all fetched jobs.`)) {
                    deleteMut.mutate();
                  }
                }}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-[var(--border)] flex gap-0">
        {[
          { key: "search" as const, label: `Job Search (${pipeline._count.search})` },
          { key: "shortlist" as const, label: `Shortlist & Apply (${pipeline._count.shortlist})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-[var(--accent-blue)] text-[var(--accent-blue)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {tab === "search" ? (
          <JobSearchTab pipeline={pipeline} />
        ) : (
          <ShortlistTab pipeline={pipeline} />
        )}
      </div>
    </div>
  );
}
