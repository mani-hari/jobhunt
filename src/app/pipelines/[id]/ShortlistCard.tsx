"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

type PipelineJob = {
  id: string;
  assetStatus: string;
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
    score: number | null;
    source: string;
    autoApplyEligible: boolean;
    sourceUrl: string;
  };
};

type Props = { pipelineJob: PipelineJob; pipelineId: string };

const ATS_RULES = [
  "Single-column layout (no sidebars)",
  "Calibri 11pt body / 14pt headings",
  "Proper Word heading styles (H1/H2)",
  "No tables, text boxes, or graphics",
  "No headers or footers",
  "Contact info in document body",
  "Black text only (no colors)",
  "Standard margins and spacing",
  "Keywords from job description integrated",
];

type SlideOverContent = "resume" | "cover" | null;

export function ShortlistCard({ pipelineJob: pj, pipelineId }: Props) {
  const qc = useQueryClient();
  const [slideOver, setSlideOver] = useState<SlideOverContent>(null);
  const [atsExpanded, setAtsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMut = useMutation({
    mutationFn: () =>
      fetch(`/api/pipelines/${pipelineId}/jobs/${pj.id}/generate`, { method: "POST" }).then(
        (r) => r.json()
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline-jobs", pipelineId] }),
  });

  const applyMut = useMutation({
    mutationFn: () =>
      fetch(`/api/pipelines/${pipelineId}/jobs/${pj.id}/apply`, { method: "POST" }).then(
        (r) => r.json()
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline-jobs", pipelineId] }),
  });

  const openApply = () => {
    fetch(`/api/pipelines/${pipelineId}/jobs/${pj.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applyStatus: "opened", applyMethod: "manual" }),
    });
    window.open(pj.job.sourceUrl, "_blank");
    qc.invalidateQueries({ queryKey: ["pipeline-jobs", pipelineId] });
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor =
    (pj.job.score ?? 0) >= 75
      ? "border-green-400"
      : (pj.job.score ?? 0) >= 50
      ? "border-amber-400"
      : "border-red-400";

  const applyStatusBadge = () => {
    switch (pj.applyStatus) {
      case "applying":
        return <span className="text-xs text-[var(--accent-blue)]">⚡ Auto-applying…</span>;
      case "applied":
        return (
          <span className="text-xs text-[var(--accent-teal)]">
            ✓ Applied via {pj.job.source}
            {pj.appliedAt && ` · ${timeAgo(pj.appliedAt)}`}
          </span>
        );
      case "failed":
        return (
          <span
            className="text-xs text-[var(--accent-red)] cursor-help"
            title={pj.applyError ?? "Unknown error"}
          >
            ✗ Failed — apply manually
          </span>
        );
      case "opened":
        return <span className="text-xs text-[var(--text-muted)]">↗ Opened</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="border border-[var(--border)] rounded-lg bg-white overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">{pj.job.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {pj.job.company} · {pj.job.location} · Score{" "}
                <span
                  className={`font-semibold ${
                    (pj.job.score ?? 0) >= 75
                      ? "text-green-600"
                      : (pj.job.score ?? 0) >= 50
                      ? "text-amber-500"
                      : "text-red-500"
                  }`}
                >
                  {pj.job.score ?? "—"}
                </span>
              </p>
            </div>
            {pj.job.autoApplyEligible && (
              <span className="px-2 py-0.5 text-xs rounded bg-[var(--accent-teal-light)] text-[var(--accent-teal)] font-medium shrink-0">
                ⚡ Auto-apply
              </span>
            )}
          </div>
        </div>

        {/* Asset boxes */}
        {pj.assetStatus === "pending" || pj.assetStatus === "generating" ? (
          <div className="px-5 py-6 text-center">
            {pj.assetStatus === "generating" ? (
              <>
                <div className="flex justify-center gap-1 mb-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Generating resume and cover letter…</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Takes 15-30 seconds</p>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--text-muted)] mb-3">Assets not generated yet.</p>
                <button
                  onClick={() => generateMut.mutate()}
                  disabled={generateMut.isPending}
                  className="px-4 py-2 text-sm bg-[var(--accent-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {generateMut.isPending ? "Starting…" : "Generate Resume + Cover"}
                </button>
              </>
            )}
          </div>
        ) : pj.assetStatus === "failed" ? (
          <div className="px-5 py-4 text-center">
            <p className="text-sm text-[var(--accent-red)] mb-2">Generation failed.</p>
            <button
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending}
              className="text-xs text-[var(--accent-blue)] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Asset boxes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[var(--border)] rounded-lg p-3">
                <p className="text-xs font-medium text-[var(--text-primary)] mb-1">Resume (.docx)</p>
                <p className="text-xs text-[var(--accent-teal)] mb-2">✓ Ready</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSlideOver("resume")}
                    className="text-xs text-[var(--accent-blue)] hover:underline"
                  >
                    View
                  </button>
                  <a
                    href={`/api/pipelines/${pipelineId}/jobs/${pj.id}/resume.docx`}
                    download
                    className="text-xs text-[var(--accent-blue)] hover:underline"
                  >
                    ↓ Download
                  </a>
                </div>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-3">
                <p className="text-xs font-medium text-[var(--text-primary)] mb-1">Cover letter</p>
                <p className="text-xs text-[var(--accent-teal)] mb-2">✓ Ready</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSlideOver("cover")}
                    className="text-xs text-[var(--accent-blue)] hover:underline"
                  >
                    View
                  </button>
                  <button
                    onClick={() => pj.generatedCover && copyText(pj.generatedCover)}
                    className="text-xs text-[var(--accent-blue)] hover:underline"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* ATS rules line */}
            <p className="text-xs text-[var(--text-muted)]">
              ATS-optimized: single-column, Calibri, heading styles, no tables/graphics
            </p>

            {/* Fit summary */}
            {pj.fitSummary && (
              <div className={`border-l-2 pl-3 ${scoreColor}`}>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pj.fitSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
          <div>{applyStatusBadge()}</div>
          {pj.assetStatus === "ready" && !pj.applyStatus && (
            <div className="flex gap-2">
              <a
                href={`/api/pipelines/${pipelineId}/jobs/${pj.id}/resume.docx`}
                download
                className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                Download .docx
              </a>
              {pj.job.autoApplyEligible ? (
                <button
                  onClick={() => applyMut.mutate()}
                  disabled={applyMut.isPending}
                  className="px-3 py-1.5 text-xs bg-[var(--accent-teal)] text-white rounded-md hover:opacity-90 disabled:opacity-50 font-medium"
                >
                  {applyMut.isPending ? "Applying…" : "Auto-Apply ⚡"}
                </button>
              ) : (
                <button
                  onClick={openApply}
                  className="px-3 py-1.5 text-xs bg-[var(--accent-blue)] text-white rounded-md hover:opacity-90 font-medium"
                >
                  Open & Apply ↗
                </button>
              )}
            </div>
          )}
          {pj.applyStatus === "failed" && (
            <button
              onClick={() => pj.job.autoApplyEligible ? applyMut.mutate() : openApply()}
              className="text-xs text-[var(--accent-blue)] hover:underline"
            >
              {pj.job.autoApplyEligible ? "Retry auto-apply" : "Open & Apply ↗"}
            </button>
          )}
        </div>
      </div>

      {/* Slide-over */}
      {slideOver && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSlideOver(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-xl flex flex-col h-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-start justify-between">
              <div>
                <h2 className="font-serif text-lg text-[var(--text-primary)]">
                  {slideOver === "resume" ? "Resume" : "Cover Letter"}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {pj.job.title} · {pj.job.company}
                </p>
              </div>
              <button
                onClick={() => setSlideOver(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl"
              >
                ×
              </button>
            </div>

            {slideOver === "resume" && (
              <div className="px-5 py-3 border-b border-[var(--border)]">
                <button
                  onClick={() => setAtsExpanded((v) => !v)}
                  className="text-xs text-[var(--accent-blue)] hover:underline"
                >
                  {atsExpanded ? "▼" : "▶"} ATS formatting rules followed
                </button>
                {atsExpanded && (
                  <ul className="mt-2 space-y-0.5">
                    {ATS_RULES.map((r) => (
                      <li key={r} className="text-xs text-[var(--text-secondary)]">
                        ✓ {r}
                      </li>
                    ))}
                    <li className="text-xs text-[var(--text-secondary)]">
                      ✓ Filename: {pj.job.company.replace(/[^a-zA-Z0-9]/g, "")}_Resume.docx
                    </li>
                  </ul>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="prose-body text-sm leading-relaxed">
                <ReactMarkdown>
                  {slideOver === "resume" ? pj.generatedResume ?? "" : pj.generatedCover ?? ""}
                </ReactMarkdown>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
              {slideOver === "resume" ? (
                <a
                  href={`/api/pipelines/${pipelineId}/jobs/${pj.id}/resume.docx`}
                  download
                  className="px-4 py-2 text-sm bg-[var(--accent-blue)] text-white rounded-md hover:opacity-90"
                >
                  Download .docx
                </a>
              ) : (
                <button
                  onClick={() => pj.generatedCover && copyText(pj.generatedCover)}
                  className="px-4 py-2 text-sm bg-[var(--accent-blue)] text-white rounded-md hover:opacity-90"
                >
                  {copied ? "Copied!" : "Copy to clipboard"}
                </button>
              )}
              <button
                onClick={() => setSlideOver(null)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function timeAgo(dateStr: string): string {
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}
