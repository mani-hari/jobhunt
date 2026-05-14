"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { BulkBar } from "@/components/jobs/BulkBar";
import { scoreColor, timeAgo } from "@/lib/format";
import type { Job } from "@/components/jobs/types";

export function DeletedView() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data = [], isLoading } = useQuery<Job[]>({
    queryKey: ["jobs", "deleted"],
    queryFn: async () => {
      const r = await fetch("/api/jobs?status=deleted&range=all");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const restoreMut = useMutation({
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

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const bulkRestore = async () => {
    await Promise.all(Array.from(selected).map((id) => restoreMut.mutateAsync(id)));
    setSelected(new Set());
  };

  if (isLoading) return <div className="text-sm text-ink-muted">Loading…</div>;
  if (data.length === 0) {
    return (
      <Empty
        title="Nothing deleted"
        body="When you delete a job from the Jobs or Shortlist page it'll show up here. Deleted jobs are excluded from future scrapes."
      />
    );
  }

  return (
    <>
      <div className="text-sm text-ink-secondary mb-3">
        <span className="font-semibold text-ink-primary">{data.length}</span> deleted job{data.length === 1 ? "" : "s"} · won&rsquo;t be re-fetched
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Posted</th>
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
                  <Link href={`/jobs/${j.id}`} className="hover:text-accent-blue">
                    <div className="font-medium text-ink-primary">{j.title}</div>
                    <div className="text-xs text-ink-secondary">{j.company} · {j.location}</div>
                  </Link>
                </td>
                <td className="px-4 py-3"><Tag>{j.source}</Tag></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${scoreColor(j.score)}`} />
                    <span>{j.score ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-secondary">{timeAgo(j.postedAt ?? j.fetchedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="secondary" onClick={() => restoreMut.mutate(j.id)}>
                    Restore
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" onClick={bulkRestore}>Restore selected</Button>
      </BulkBar>
    </>
  );
}
