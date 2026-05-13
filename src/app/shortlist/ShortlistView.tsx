"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";
import { BulkBar } from "@/components/jobs/BulkBar";
import { JobRow } from "@/components/jobs/JobRow";
import { JobDetail } from "@/components/jobs/JobDetail";
import type { Job } from "@/components/jobs/types";

export function ShortlistView() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Job | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery<Job[]>({
    queryKey: ["jobs", "shortlist"],
    queryFn: async () => {
      const r = await fetch("/api/jobs?status=shortlisted&range=all");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const removeMut = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "discovered" }),
      });
    },
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

  const bulkGenerate = async () => {
    for (const id of Array.from(selected)) {
      await generateOne(id);
    }
    setSelected(new Set());
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  if (isLoading) return <div className="text-sm text-ink-muted">Loading shortlist…</div>;
  if (data.length === 0) {
    return (
      <Empty
        title="Your shortlist is empty"
        body="Head to the Jobs page and add roles you want to apply to. Generate tailored materials from here."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {data.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            selected={selected.has(job.id)}
            onToggleSelect={() => toggle(job.id)}
            onView={() => setDetail(job)}
            onGenerate={() => generateOne(job.id)}
            onRemove={() => removeMut.mutate(job.id)}
            generating={busyId === job.id}
          />
        ))}
      </div>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" onClick={bulkGenerate}>
          Generate materials for selected
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await Promise.all(Array.from(selected).map((id) => removeMut.mutateAsync(id)));
            setSelected(new Set());
          }}
        >
          Remove
        </Button>
      </BulkBar>

      <JobDetail job={detail} onClose={() => setDetail(null)} />
    </>
  );
}
