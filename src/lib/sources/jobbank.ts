import type { NormalizedJob } from "@/lib/types";
import type { SourceContext } from "./index";

// Note: Job Bank's open data feeds are limited. We use the public job search RSS-style
// JSON endpoint when available; otherwise return [].
// Endpoint reference: https://www.jobbank.gc.ca/api/

interface JobBankJob {
  id?: string | number;
  jobTitle?: string;
  businessName?: string;
  city?: string;
  province?: string;
  description?: string;
  url?: string;
  postingDate?: string;
}

export async function fetchJobBank(ctx: SourceContext): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];
  for (const kw of ctx.keywords.slice(0, 3)) {
    const u = new URL("https://www.jobbank.gc.ca/jobsearch/jobsearch");
    u.searchParams.set("searchstring", kw);
    u.searchParams.set("locationstring", ctx.location);
    u.searchParams.set("fsrc", "32");
    u.searchParams.set("sort", "M");
    u.searchParams.set("fage", "30");
    u.searchParams.set("mid", "");

    try {
      const r = await fetch(u, {
        cache: "no-store",
        headers: { accept: "application/json", "user-agent": "archana-job-hunter/1.0" },
      });
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) continue;
      const data = (await r.json()) as { jobs?: JobBankJob[] };
      for (const j of data.jobs ?? []) {
        out.push({
          title: j.jobTitle ?? "Untitled",
          company: j.businessName ?? "Unknown",
          location: [j.city, j.province].filter(Boolean).join(", ") || ctx.location,
          description: j.description ?? "",
          sourceUrl: j.url ?? "https://www.jobbank.gc.ca",
          source: "jobbank",
          postedAt: j.postingDate ? new Date(j.postingDate) : null,
        });
      }
    } catch {
      // ignore - jobbank surface is best-effort
    }
  }
  return out;
}
