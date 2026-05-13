import type { NormalizedJob } from "@/lib/types";
import type { SourceContext } from "./index";

interface AdzunaJob {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url: string;
  created?: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  contract_type?: string;
  category?: { label?: string };
}

export async function fetchAdzuna(ctx: SourceContext): Promise<NormalizedJob[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return [];

  const out: NormalizedJob[] = [];
  for (const kw of ctx.keywords.slice(0, 5)) {
    const u = new URL("https://api.adzuna.com/v1/api/jobs/ca/search/1");
    u.searchParams.set("app_id", id);
    u.searchParams.set("app_key", key);
    u.searchParams.set("what", kw);
    u.searchParams.set("where", ctx.location);
    u.searchParams.set("results_per_page", "30");
    u.searchParams.set("content-type", "application/json");

    const r = await fetch(u, { cache: "no-store" });
    if (!r.ok) continue;
    const data = (await r.json()) as { results?: AdzunaJob[] };
    for (const j of data.results ?? []) {
      out.push({
        title: j.title,
        company: j.company?.display_name ?? "Unknown",
        location: j.location?.display_name ?? ctx.location,
        description: j.description ?? "",
        sourceUrl: j.redirect_url,
        source: "adzuna",
        postedAt: j.created ? new Date(j.created) : null,
        salaryMin: j.salary_min ?? null,
        salaryMax: j.salary_max ?? null,
        employment: mapEmployment(j.contract_time, j.contract_type),
        industry: j.category?.label ?? null,
      });
    }
  }
  return out;
}

function mapEmployment(time?: string, type?: string): string | null {
  if (time === "full_time") return "fulltime";
  if (time === "part_time") return "parttime";
  if (type === "contract") return "contract";
  return null;
}
