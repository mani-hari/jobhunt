"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SidebarFilters,
  DEFAULT_FILTERS,
  filterToQuery,
  type FilterState,
} from "@/components/jobs/SidebarFilters";
import { JobRow } from "@/components/jobs/JobRow";
import { JobDetail } from "@/components/jobs/JobDetail";
import { BulkBar } from "@/components/jobs/BulkBar";
import { QuoteBanner } from "@/components/jobs/QuoteBanner";
import { StatsBar } from "@/components/jobs/StatsBar";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";
import type { Job } from "@/components/jobs/types";

export function JobsView() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Job | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryKey = useMemo(() => ["jobs", filters], [filters]);
  const { data = [], isLoading } = useQuery<Job[]>({
    queryKey,
    queryFn: async () => {
      const r = await fetch(`/api/jobs?${filterToQuery(filters)}`);
      if (!r.ok) throw new Error("Failed to load jobs");
      return r.json();
    },
  });

  const refreshMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/jobs/refresh", { method: "POST" });
      if (!r.ok) throw new Error("Refresh failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const shortlistMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "shortlisted" }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const markApplied = (id: string) => {
    fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "applied" }),
    }).then(() => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    });
  };

  const generateOne = async (id: string) => {
    setBusyId(id);
    try {
      const r = await fetch(`/api/jobs/${id}/generate`, { method: "POST" });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { error?: string };
        alert(err.error ?? "Generation failed");
      }
    } finally {
      setBusyId(null);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    }
  };

  const bulkShortlist = async () => {
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/jobs/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "shortlisted" }),
        })
      )
    );
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <StatsBar />
        </div>
        <div className="lg:col-span-1">
          <QuoteBanner />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-ink-primary">Job feed</h2>
        <Button onClick={() => refreshMut.mutate()} disabled={refreshMut.isPending}>
          {refreshMut.isPending ? "Refreshing…" : "Refresh jobs"}
        </Button>
      </div>

      {refreshMut.data ? (
        <div className="text-xs text-ink-muted -mt-3">
          Last refresh added {refreshMut.data.inserted} new · skipped {refreshMut.data.skipped} duplicates ·
          {" "}{refreshMut.data.fetched} fetched across {refreshMut.data.keywordsUsed} keyword variants.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
        <div className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
          <SidebarFilters value={filters} onChange={setFilters} />
        </div>

        <div className="min-w-0 space-y-3">
          {isLoading ? (
            <div className="text-sm text-ink-muted py-12 text-center">Loading jobs…</div>
          ) : data.length === 0 ? (
            <Empty
              title="No jobs match these filters"
              body="Try widening the date range or clearing filters. Or click Refresh to pull a fresh batch."
              action={<Button onClick={() => refreshMut.mutate()}>Refresh now</Button>}
            />
          ) : (
            data.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                selected={selected.has(job.id)}
                onToggleSelect={() => toggle(job.id)}
                onView={() => setDetail(job)}
                onShortlist={() => shortlistMut.mutate(job.id)}
                onGenerate={() => generateOne(job.id)}
                onApply={() => markApplied(job.id)}
                generating={busyId === job.id}
              />
            ))
          )}
        </div>
      </div>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" onClick={bulkShortlist}>
          Add to shortlist
        </Button>
      </BulkBar>

      <JobDetail
        job={detail}
        onClose={() => setDetail(null)}
        onShortlist={(id) => {
          shortlistMut.mutate(id);
          setDetail(null);
        }}
      />
    </div>
  );
}
