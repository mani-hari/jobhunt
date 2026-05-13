import type { NormalizedJob } from "@/lib/types";
import type { SourceContext } from "./index";

interface JSearchJob {
  job_title: string;
  employer_name?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description?: string;
  job_apply_link: string;
  job_posted_at_datetime_utc?: string;
  job_employment_type?: string;
  job_employment_types?: string[];
  job_is_remote?: boolean;
  job_min_salary?: number;
  job_max_salary?: number;
  job_publisher?: string;
}

export async function fetchJSearch(ctx: SourceContext): Promise<NormalizedJob[]> {
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
    if (ctx.remote) u.searchParams.set("work_from_home", "true");

    const r = await fetch(u, {
      cache: "no-store",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
    });
    if (!r.ok) continue;
    // search-v2 wraps results: { status, data: { jobs: [...] } }
    // (the legacy /search endpoint had { data: [...] } directly)
    const body = (await r.json()) as { data?: JSearchJob[] | { jobs?: JSearchJob[] } };
    const jobs: JSearchJob[] = Array.isArray(body.data)
      ? body.data
      : body.data?.jobs ?? [];
    for (const j of jobs) {
      const loc = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || ctx.location;
      out.push({
        title: j.job_title,
        company: j.employer_name ?? "Unknown",
        location: loc,
        description: j.job_description ?? "",
        sourceUrl: j.job_apply_link,
        source: "jsearch",
        postedAt: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : null,
        employment: mapEmployment(j.job_employment_types?.[0] ?? j.job_employment_type),
        jobType: j.job_is_remote ? "remote" : null,
        salaryMin: j.job_min_salary ?? null,
        salaryMax: j.job_max_salary ?? null,
      });
    }
  }
  return out;
}

function mapEmployment(t?: string): string | null {
  switch (t) {
    case "FULLTIME":
      return "fulltime";
    case "PARTTIME":
      return "parttime";
    case "CONTRACTOR":
    case "CONTRACT":
      return "contract";
    default:
      return null;
  }
}
