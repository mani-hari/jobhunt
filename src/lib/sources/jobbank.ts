import { NormalizedJob } from "@/lib/types";
import { FetchContext } from "./index";

interface JobBankJob {
  jobTitle?: string;
  businessName?: string;
  city?: string;
  province?: string;
  description?: string;
  url?: string;
  postingDate?: string;
}

export async function fetchJobBank(ctx: FetchContext): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];
  for (const kw of ctx.keywords.slice(0, 3)) {
    const u = new URL("https://www.jobbank.gc.ca/jobsearch/jobsearch");
    u.searchParams.set("searchstring", kw);
    u.searchParams.set("locationstring", ctx.location);
    u.searchParams.set("fsrc", "32");
    u.searchParams.set("sort", "M");
    u.searchParams.set("fage", "30");

    try {
      const r = await fetch(u, {
        cache: "no-store",
        headers: { accept: "application/json", "user-agent": "archana-job-hunter/1.0" },
      });
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) continue;
      const data = (await r.json()) as { jobs?: JobBankJob[] };
      for (const j of (data.jobs ?? []).slice(0, ctx.limit)) {
        out.push({
          title: j.jobTitle ?? "Untitled",
          company: j.businessName ?? "Unknown",
          location: [j.city, j.province].filter(Boolean).join(", ") || ctx.location,
          description: j.description ?? "",
          sourceUrl: j.url ?? "https://www.jobbank.gc.ca",
          source: "jobbank",
          postedAt: j.postingDate ? new Date(j.postingDate) : undefined,
          autoApplyEligible: false,
        });
      }
    } catch {
      // best-effort
    }
  }
  return out;
}
