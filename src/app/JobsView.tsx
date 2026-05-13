"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filters, DEFAULT_FILTERS, filterToQuery, type FilterState } from "@/components/jobs/Filters";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetail } from "@/components/jobs/JobDetail";
import { BulkBar } from "@/components/jobs/BulkBar";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";
import type { Job } from "@/components/jobs/types";

export function JobsView() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Job | null>(null);

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

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
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Filters value={filters} onChange={setFilters} />
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button onClick={() => refreshMut.mutate()} disabled={refreshMut.isPending}>
            {refreshMut.isPending ? "Refreshing…" : "Refresh jobs"}
          </Button>
        </div>
      </div>

      {refreshMut.data ? (
        <div className="text-xs text-ink-muted">
          Last refresh added {refreshMut.data.inserted} new · skipped {refreshMut.data.skipped} duplicates ·
          {" "}{refreshMut.data.fetched} fetched across {refreshMut.data.keywordsUsed} keyword variants.
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-ink-muted py-12 text-center">Loading jobs…</div>
      ) : data.length === 0 ? (
        <Empty
          title="No jobs match these filters"
          body="Try clearing filters or click Refresh to fetch new listings from your sources."
          action={<Button onClick={() => refreshMut.mutate()}>Refresh now</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              selected={selected.has(job.id)}
              onToggleSelect={() => toggle(job.id)}
              onView={() => setDetail(job)}
              onShortlist={() => shortlistMut.mutate(job.id)}
            />
          ))}
        </div>
      )}

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
