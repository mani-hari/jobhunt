import type { NormalizedJob } from "@/lib/types";
import type { SourceContext } from "./index";

interface RemoteOKJob {
  id?: string;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  apply_url?: string;
  date?: string;
  tags?: string[];
}

export async function fetchRemoteOK(ctx: SourceContext): Promise<NormalizedJob[]> {
  const r = await fetch("https://remoteok.com/api", {
    cache: "no-store",
    headers: { "user-agent": "archana-job-hunter/1.0" },
  });
  if (!r.ok) return [];
  const list = (await r.json()) as Array<RemoteOKJob | Record<string, unknown>>;
  const jobs = list.filter((x): x is RemoteOKJob => !!(x as RemoteOKJob).position);

  const kwLower = ctx.keywords.map((k) => k.toLowerCase());
  const matches = jobs.filter((j) => {
    const hay = `${j.position} ${(j.tags ?? []).join(" ")}`.toLowerCase();
    return kwLower.some((kw) => hay.includes(kw));
  });

  return matches.slice(0, 50).map((j) => ({
    title: j.position ?? "Untitled",
    company: j.company ?? "Unknown",
    location: j.location ?? "Remote",
    description: stripHtml(j.description ?? ""),
    sourceUrl: j.apply_url || j.url || `https://remoteok.com/remote-jobs/${j.id}`,
    source: "remoteok",
    postedAt: j.date ? new Date(j.date) : null,
    jobType: "remote",
    industry: (j.tags ?? []).slice(0, 3).join(", ") || null,
  }));
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
