"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Card, CardSection } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { ScoreBar } from "@/components/jobs/ScoreBar";
import { JobNav } from "@/components/jobs/JobNav";
import { formatSalary, timeAgo } from "@/lib/format";
import { STATUS_LABEL, type JobStatus } from "@/lib/types";
import type { Job } from "@/components/jobs/types";

export function JobDetailView({ job }: { job: Job }) {
  const router = useRouter();
  const qc = useQueryClient();

  const patch = useMutation({
    mutationFn: async (status: JobStatus) => {
      const r = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      router.refresh();
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/jobs/${job.id}/generate`, { method: "POST" });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Generation failed");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      router.refresh();
    },
  });

  const score = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/jobs/${job.id}/score`, { method: "POST" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      router.refresh();
    },
  });

  const isShortlisted = job.status !== "discovered" && job.status !== "deleted";
  const detail = job.scoreDetails ? safeParse(job.scoreDetails) : null;

  return (
    <>
      <header className="px-8 pt-6 pb-4 border-b border-line bg-bg-primary/70 backdrop-blur sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="text-sm text-ink-secondary hover:text-accent-blue inline-flex items-center gap-1 mb-3"
        >
          <span aria-hidden>←</span> Back to results
        </button>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-semibold text-ink-primary leading-tight">{job.title}</h1>
            <div className="text-sm text-ink-secondary mt-1">
              <span className="font-medium text-ink-primary">{job.company}</span>
              <span className="text-ink-muted"> · </span>
              {job.location}
              <span className="text-ink-muted"> · Posted {timeAgo(job.postedAt ?? job.fetchedAt)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.jobType ? <Tag tone="blue">{job.jobType}</Tag> : null}
              {job.employment ? <Tag>{job.employment}</Tag> : null}
              {job.industry ? <Tag>{job.industry}</Tag> : null}
              <Tag>{job.source}</Tag>
              {formatSalary(job.salaryMin, job.salaryMax) ? (
                <Tag tone="green">{formatSalary(job.salaryMin, job.salaryMax)}</Tag>
              ) : null}
              <Tag tone={job.status === "deleted" ? "red" : "neutral"}>{STATUS_LABEL[job.status as JobStatus] ?? job.status}</Tag>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <JobNav currentId={job.id} />
            {!isShortlisted ? (
              <Button onClick={() => patch.mutate("shortlisted")} disabled={patch.isPending}>
                Add to shortlist ⭐
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => patch.mutate("discovered")} disabled={patch.isPending}>
                Remove from shortlist
              </Button>
            )}
            <Button variant="secondary" onClick={() => generate.mutate()} disabled={generate.isPending}>
              {generate.isPending ? "Generating…" : "Generate materials"}
            </Button>
            <Button variant="secondary" onClick={() => score.mutate()} disabled={score.isPending}>
              {score.isPending ? "Scoring…" : job.score != null ? "Re-score" : "Score with AI"}
            </Button>
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button>Open posting ↗</Button>
            </a>
            {job.status !== "deleted" ? (
              <Button variant="danger" onClick={() => patch.mutate("deleted")} disabled={patch.isPending}>
                Delete
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => patch.mutate("discovered")} disabled={patch.isPending}>
                Restore
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardSection>
              <h2 className="font-serif text-lg font-semibold mb-3">About the role</h2>
              <div className="prose-body text-sm whitespace-pre-wrap">{stripHtml(job.description)}</div>
            </CardSection>
          </Card>

          {job.fitAnalysis ? (
            <Card>
              <CardSection>
                <h2 className="font-serif text-lg font-semibold mb-2">Fit analysis</h2>
                <p className="prose-body text-sm">{job.fitAnalysis}</p>
              </CardSection>
            </Card>
          ) : null}

          {job.generatedResume ? (
            <Materials
              title="Resume — impact-led variant"
              subtitle="Leads each bullet with outcome, number, and scope. Good default for most roles."
              content={job.generatedResume}
              filename={`${job.company}-resume-impact.md`}
            />
          ) : null}
          {job.generatedResumeAlt ? (
            <Materials
              title="Resume — skills-led variant"
              subtitle="Leads with technical/domain match. Try this when the JD is keyword-heavy or ATS-strict."
              content={job.generatedResumeAlt}
              filename={`${job.company}-resume-skills.md`}
            />
          ) : null}
          {job.generatedCover ? (
            <Materials title="Cover letter" content={job.generatedCover} filename={`${job.company}-cover.md`} />
          ) : null}
          {job.generatedEmail ? (
            <Materials title="Outreach email" content={job.generatedEmail} filename={`${job.company}-email.md`} />
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardSection>
              <h3 className="font-serif text-sm font-semibold uppercase tracking-wide text-ink-secondary mb-3">Score</h3>
              <ScoreBar score={job.score} summary={job.scoreSummary} />
              {detail ? (
                <div className="mt-4 space-y-3 text-sm">
                  {detail.strengths?.length ? (
                    <div>
                      <div className="text-xs font-semibold text-accent-green uppercase tracking-wide">Strengths</div>
                      <ul className="mt-1 space-y-1 text-ink-secondary list-disc pl-4">
                        {detail.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {detail.gaps?.length ? (
                    <div>
                      <div className="text-xs font-semibold text-accent-amber uppercase tracking-wide">Gaps</div>
                      <ul className="mt-1 space-y-1 text-ink-secondary list-disc pl-4">
                        {detail.gaps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {detail.tip ? (
                    <div className="rounded-lg bg-accent-blue-light/50 p-3">
                      <div className="text-xs font-semibold text-accent-blue uppercase tracking-wide">Tip</div>
                      <p className="text-ink-secondary mt-1">{detail.tip}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardSection>
          </Card>

          <Card>
            <CardSection>
              <h3 className="font-serif text-sm font-semibold uppercase tracking-wide text-ink-secondary mb-3">Research</h3>
              <ResearchLinks company={job.company} />
            </CardSection>
          </Card>

          <Link href="/" className="block">
            <Button variant="secondary" className="w-full">← Back to job feed</Button>
          </Link>
        </aside>
      </div>
    </>
  );
}

function Materials({
  title,
  subtitle,
  content,
  filename,
}: {
  title: string;
  subtitle?: string;
  content: string;
  filename: string;
}) {
  return (
    <Card>
      <CardSection>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="font-serif text-lg font-semibold">{title}</h2>
            {subtitle ? (
              <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(content)}
            >
              Copy
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const blob = new Blob([content], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename.replace(/\s+/g, "_");
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download .md
            </Button>
          </div>
        </div>
        <div className="prose-body text-sm">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </CardSection>
    </Card>
  );
}

function ResearchLinks({ company }: { company: string }) {
  const enc = encodeURIComponent(company);
  const links = [
    { label: "LinkedIn company page", href: `https://www.linkedin.com/company/${slugify(company)}` },
    { label: "Search LinkedIn", href: `https://www.google.com/search?q=site%3Alinkedin.com%2Fcompany+${enc}` },
    { label: "Company website (Google)", href: `https://www.google.com/search?q=${enc}+official+website` },
    { label: "Glassdoor reviews", href: `https://www.google.com/search?q=${enc}+glassdoor+reviews` },
    { label: "Recent news", href: `https://news.google.com/search?q=${enc}` },
    { label: "Careers page", href: `https://www.google.com/search?q=${enc}+careers` },
  ];
  return (
    <ul className="space-y-1.5 text-sm">
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue hover:underline"
          >
            {l.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

interface ScoreDetail {
  strengths?: string[];
  gaps?: string[];
  tip?: string;
}
function safeParse(s: string): ScoreDetail | null {
  try {
    return JSON.parse(s) as ScoreDetail;
  } catch {
    return null;
  }
}
