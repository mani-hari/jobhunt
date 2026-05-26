import { NormalizedJob, PlatformKey } from "@/lib/types";
import { FetchContext } from "./index";

interface JSearchJob {
  job_title: string;
  employer_name?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description?: string;
  job_apply_link: string;
  job_posted_at_datetime_utc?: string;
  job_employment_types?: string[];
  job_employment_type?: string;
  job_is_remote?: boolean;
  job_min_salary?: number;
  job_max_salary?: number;
  job_publisher?: string;
}

// Used for both linkedin and indeed platform keys
export async function fetchJSearch(
  ctx: FetchContext,
  platform: Extract<PlatformKey, "linkedin" | "indeed">
): Promise<NormalizedJob[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  const out: NormalizedJob[] = [];
  for (const kw of ctx.keywords.slice(0, 3)) {
    const u = new URL("https://jsearch.p.rapidapi.com/search-v2");
    u.searchParams.set("query", `${kw} in ${ctx.location}`);
    u.searchParams.set("page", "1");
    u.searchParams.set("num_pages", "1");
    u.searchParams.set("country", "ca");
    u.searchParams.set("date_posted", "month");
    if (ctx.openToRemote) u.searchParams.set("work_from_home", "true");
    if (platform === "linkedin") u.searchParams.set("publisher", "linkedin");
    if (platform === "indeed") u.searchParams.set("publisher", "indeed");

    try {
      const r = await fetch(u, {
        cache: "no-store",
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
        },
      });
      if (!r.ok) continue;
      // search-v2 wraps: { data: { jobs: [...] } } or { data: [...] }
      const body = (await r.json()) as { data?: JSearchJob[] | { jobs?: JSearchJob[] } };
      const jobs: JSearchJob[] = Array.isArray(body.data)
        ? body.data
        : (body.data as { jobs?: JSearchJob[] })?.jobs ?? [];

      for (const j of jobs.slice(0, ctx.limit)) {
        const loc = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || ctx.location;
        out.push({
          title: j.job_title,
          company: j.employer_name ?? "Unknown",
          location: loc,
          description: j.job_description ?? "",
          sourceUrl: j.job_apply_link,
          source: platform,
          postedAt: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : undefined,
          employment: mapEmployment(j.job_employment_types?.[0] ?? j.job_employment_type),
          jobType: j.job_is_remote ? "remote" : undefined,
          salaryMin: j.job_min_salary,
          salaryMax: j.job_max_salary,
          autoApplyEligible: false,
        });
      }
    } catch {
      // continue on per-keyword failure
    }
  }
  return out;
}

function mapEmployment(t?: string): string | undefined {
  switch (t) {
    case "FULLTIME": return "fulltime";
    case "PARTTIME": return "parttime";
    case "CONTRACTOR":
    case "CONTRACT": return "contract";
    default: return undefined;
  }
}
