"use client";

import ReactMarkdown from "react-markdown";

type Job = {
  title: string;
  company: string;
  location: string;
  description: string;
  sourceUrl: string;
};

type Props = { job: Job; onClose: () => void };

export function JobDescriptionSlideOver({ job, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg text-[var(--text-primary)]">{job.title}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {job.company} · {job.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none mt-0.5"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="prose-body text-sm leading-relaxed">
            <ReactMarkdown>{job.description}</ReactMarkdown>
          </div>
          {!job.description && (
            <p className="text-sm text-[var(--text-muted)]">No description available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)]">
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[var(--accent-blue)] hover:underline"
          >
            Open job posting ↗
          </a>
        </div>
      </div>
    </div>
  );
}
