"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { SlideOver } from "@/components/ui/SlideOver";
import { scoreColor, timeAgo } from "@/lib/format";
import { STATUS_LABEL, type JobStatus } from "@/lib/types";
import type { Job } from "@/components/jobs/types";

function paneText(job: Job, pane: Exclude<Pane, null>): string | null {
  if (pane === "resume") return job.generatedResume;
  if (pane === "resumeAlt") return job.generatedResumeAlt;
  if (pane === "cover") return job.generatedCover;
  if (pane === "email") return job.generatedEmail;
  return job.fitAnalysis;
}

const STATUSES: JobStatus[] = [
  "resume_generated",
  "applied",
  "interview",
  "offer",
  "rejected",
  "hold",
];

type Pane = "resume" | "resumeAlt" | "cover" | "email" | "fit" | null;

const PANE_LABEL: Record<Exclude<Pane, null>, string> = {
  resume: "Resume (impact-led)",
  resumeAlt: "Resume (skills-led)",
  cover: "Cover letter",
  email: "Outreach email",
  fit: "Fit analysis",
};

export function ApplicationsView() {
  const qc = useQueryClient();
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const [pane, setPane] = useState<Pane>(null);

  const { data = [], isLoading } = useQuery<Job[]>({
    queryKey: ["jobs", "applications"],
    queryFn: async () => {
      const r = await fetch("/api/jobs?status=applied_pipeline&range=all");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JobStatus }) => {
      await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  if (isLoading) return <div className="text-sm text-ink-muted">Loading applications…</div>;
  if (data.length === 0) {
    return (
      <Empty
        title="No applications yet"
        body="Generate tailored materials from a job in your Shortlist to start tracking it here."
      />
    );
  }

  return (
    <>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((j) => (
              <tr key={j.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink-primary">{j.title}</div>
                  <div className="text-xs text-ink-secondary">{j.company} · {j.location}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${scoreColor(j.score)}`} />
                    <span className="text-ink-primary">{j.score ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={j.status}
                    onChange={(e) =>
                      updateStatus.mutate({ id: j.id, status: e.target.value as JobStatus })
                    }
                    className="text-sm rounded-md border border-line bg-bg-card px-2 py-1 focus:outline-none focus:border-line-focus"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-ink-secondary">
                  {timeAgo(j.appliedAt ?? j.shortlistedAt ?? j.fetchedAt)}
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button size="sm" variant="secondary" onClick={() => { setOpenJob(j); setPane("resume"); }}>
                    Resume A
                  </Button>
                  {j.generatedResumeAlt ? (
                    <Button size="sm" variant="secondary" onClick={() => { setOpenJob(j); setPane("resumeAlt"); }}>
                      Resume B
                    </Button>
                  ) : null}
                  <Button size="sm" variant="secondary" onClick={() => { setOpenJob(j); setPane("cover"); }}>
                    Cover letter
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setOpenJob(j); setPane("email"); }}>
                    Email
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setOpenJob(j); setPane("fit"); }}>
                    Fit
                  </Button>
                  <a href={j.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm">Open posting ↗</Button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SlideOver
        open={!!openJob && !!pane}
        onClose={() => { setOpenJob(null); setPane(null); }}
        title={openJob && pane ? `${PANE_LABEL[pane]} · ${openJob.title}` : ""}
        footer={
          openJob && pane && pane !== "fit" ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const text = paneText(openJob, pane);
                  if (text) navigator.clipboard.writeText(text);
                }}
              >
                Copy markdown
              </Button>
              <Button
                onClick={() => {
                  const text = paneText(openJob, pane) ?? "";
                  const blob = new Blob([text], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${openJob.company}-${pane}.md`.replace(/\s+/g, "_");
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download .md
              </Button>
            </div>
          ) : null
        }
      >
        {openJob && pane ? (
          <div className="px-6 py-5 prose-body text-sm">
            {pane === "fit" ? (
              <p>{openJob.fitAnalysis ?? "No fit analysis available."}</p>
            ) : (
              <ReactMarkdown>{paneText(openJob, pane) ?? `_No ${PANE_LABEL[pane].toLowerCase()} generated yet._`}</ReactMarkdown>
            )}
          </div>
        ) : null}
      </SlideOver>
    </>
  );
}
