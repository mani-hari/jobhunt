"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SidebarFilters,
  DEFAULT_FILTERS,
  filterToQuery,
  filterFromSearchParams,
  type FilterState,
} from "@/components/jobs/SidebarFilters";
import { JobRow } from "@/components/jobs/JobRow";
import { BulkBar } from "@/components/jobs/BulkBar";
import { QuoteBanner } from "@/components/jobs/QuoteBanner";
import { StatsBar } from "@/components/jobs/StatsBar";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Job } from "@/components/jobs/types";

export function JobsView() {
  const router = useRouter();
  const sp = useSearchParams();
  const qc = useQueryClient();

  const [filters, setFilters] = useState<FilterState>(() => filterFromSearchParams(sp));
  useEffect(() => {
    // Keep URL in sync so detail-page Back returns to the same filters.
    const qs = filterToQuery(filters);
    router.replace(`/?${qs}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
      const ac = new AbortController();
      abortRef.current = ac;
      const r = await fetch("/api/jobs/refresh", { method: "POST", signal: ac.signal });
      if (!r.ok) throw new Error("Refresh failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const autoScoreMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/jobs/auto-score?limit=50", { method: "POST" });
      if (!r.ok) throw new Error("Auto-score failed");
      return r.json() as Promise<{ scored: number; failed: number; remaining: number }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const startRefresh = () => {
    setConfirmRefresh(false);
    refreshMut.mutate();
  };

  const cancelRefresh = () => {
    abortRef.current?.abort();
    refreshMut.reset();
  };

  const patchStatus = async (id: string, status: string) => {
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const shortlistMut = useMutation({
    mutationFn: (id: string) => patchStatus(id, "shortlisted"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

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
    await Promise.all(Array.from(selected).map((id) => patchStatus(id, "shortlisted")));
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    const ok = window.confirm(
      `Permanently delete ${selected.size} job${selected.size === 1 ? "" : "s"}? They won't be re-fetched on future refreshes.`
    );
    if (!ok) return;
    await Promise.all(Array.from(selected).map((id) => patchStatus(id, "deleted")));
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

  const isFiltered =
    filters.range !== "7d" ||
    filters.type.length ||
    filters.employment.length ||
    filters.level.length ||
    filters.industry.length ||
    filters.source.length ||
    filters.minScore != null;

  return (
    <div className="space-y-6">
      <QuoteBanner />

      <StatsBar />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-serif text-xl font-semibold text-ink-primary">Job feed</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => autoScoreMut.mutate()}
            disabled={autoScoreMut.isPending}
            title="Score all unscored jobs against your resume + preferences with Claude Haiku"
          >
            {autoScoreMut.isPending ? "Rating jobs…" : "Auto-rate jobs ✨"}
          </Button>
          {refreshMut.isPending ? (
            <>
              <span className="text-xs text-ink-muted animate-pulse">Scraping…</span>
              <Button variant="danger" onClick={cancelRefresh}>
                Cancel refresh
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmRefresh(true)}>Re-scrape sources</Button>
          )}
        </div>
      </div>

      {refreshMut.data ? (
        <div className="text-xs text-ink-muted -mt-3">
          Last refresh added {refreshMut.data.inserted} new · skipped {refreshMut.data.skipped} duplicates ·
          {" "}{refreshMut.data.fetched} fetched across {refreshMut.data.keywordsUsed} keyword variants.
        </div>
      ) : null}

      {autoScoreMut.data ? (
        <div className="text-xs text-ink-muted -mt-3">
          Auto-rated {autoScoreMut.data.scored} job{autoScoreMut.data.scored === 1 ? "" : "s"}
          {autoScoreMut.data.failed > 0 ? ` (${autoScoreMut.data.failed} failed)` : ""} ·
          {" "}{autoScoreMut.data.remaining} still unrated. Filter by score above to focus.
        </div>
      ) : null}
      {autoScoreMut.isError ? (
        <div className="text-xs text-accent-red -mt-3">
          Auto-rate failed: {(autoScoreMut.error as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
        <div className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
          <SidebarFilters value={filters} onChange={setFilters} />
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between text-sm text-ink-secondary">
            <div>
              <span className="font-semibold text-ink-primary">
                {isLoading ? "—" : data.length} job{data.length === 1 ? "" : "s"} found
              </span>
              {isFiltered ? <span className="text-ink-muted"> (filtered)</span> : null}
            </div>
            {selected.size > 0 ? (
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-ink-secondary hover:text-accent-blue"
              >
                Deselect all
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="text-sm text-ink-muted py-12 text-center">Loading jobs…</div>
          ) : data.length === 0 ? (
            <Empty
              title="No jobs match these filters"
              body="Try widening the date range or clearing filters. Or run a fresh scrape to pull more listings."
              action={<Button onClick={() => setConfirmRefresh(true)}>Re-scrape sources</Button>}
            />
          ) : (
            data.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                selected={selected.has(job.id)}
                onToggleSelect={() => toggle(job.id)}
                onShortlist={() => shortlistMut.mutate(job.id)}
                onGenerate={() => generateOne(job.id)}
                generating={busyId === job.id}
                filterQuery={filterToQuery(filters)}
              />
            ))
          )}
        </div>
      </div>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" onClick={bulkShortlist}>Add to shortlist</Button>
        <Button size="sm" variant="danger" onClick={bulkDelete}>Delete</Button>
      </BulkBar>

      <Modal
        open={confirmRefresh}
        onClose={() => setConfirmRefresh(false)}
        title="Re-scrape all sources?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmRefresh(false)}>Cancel</Button>
            <Button onClick={startRefresh}>Yes, run scrape</Button>
          </div>
        }
      >
        <p className="text-sm text-ink-secondary leading-relaxed">
          This will query Adzuna, JSearch, RemoteOK, Job Bank, your Greenhouse / Lever / Ashby
          boards, and Google Custom Search using all of your active keywords. It typically pulls
          dozens (sometimes hundreds) of new listings and takes 30–60 seconds.
        </p>
        <p className="text-sm text-ink-secondary leading-relaxed mt-3">
          Sources have daily/monthly free-tier quotas — running this many times in a row can
          burn through them. A scheduled scrape runs automatically every 6 hours.
        </p>
      </Modal>
    </div>
  );
}
