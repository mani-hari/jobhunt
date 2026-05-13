"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Empty } from "@/components/ui/Empty";
import { BulkBar } from "@/components/jobs/BulkBar";
import { JobDetail } from "@/components/jobs/JobDetail";
import { scoreColor, timeAgo } from "@/lib/format";
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
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
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((j) => (
              <tr key={j.id} className="border-b border-line last:border-0 hover:bg-bg-hover">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(j.id)}
                    onChange={() => toggle(j.id)}
                    className="h-4 w-4 accent-accent-blue"
                  />
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetail(j)} className="text-left">
                    <div className="font-medium text-ink-primary">{j.title}</div>
                    <div className="text-xs text-ink-secondary">{j.company} · {j.location}</div>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {j.jobType ? <Tag tone="blue">{j.jobType}</Tag> : null}
                    {j.employment ? <Tag>{j.employment}</Tag> : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${scoreColor(j.score)}`} />
                    <span className="text-ink-primary">{j.score ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-secondary">{timeAgo(j.shortlistedAt ?? j.fetchedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <Button size="sm" disabled={busyId === j.id} onClick={() => generateOne(j.id)}>
                      {busyId === j.id ? "Generating…" : "Generate resume"}
                    </Button>
                    <a href={j.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary">↗</Button>
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => removeMut.mutate(j.id)}>
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" onClick={bulkGenerate}>
          Generate resumes for selected
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
