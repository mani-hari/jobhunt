import type { NormalizedJob } from "@/lib/types";
import type { SourceContext } from "./index";
import { matchesKeywords } from "./match";

interface AshbyJob {
  id: string;
  title: string;
  jobUrl?: string;
  applicationLink?: string;
  publishedDate?: string;
  updatedAt?: string;
  location?: string;
  locationName?: string;
  isRemote?: boolean;
  employmentType?: string;
  department?: string;
  team?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
}

export async function fetchAshby(
  ctx: SourceContext,
  boards: Array<{ slug: string; name: string }>
): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];

  for (const board of boards) {
    try {
      const u = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board.slug)}?includeCompensation=true`;
      const r = await fetch(u, { cache: "no-store", headers: { accept: "application/json" } });
      if (!r.ok) continue;
      const data = (await r.json()) as { jobs?: AshbyJob[] };

      for (const j of data.jobs ?? []) {
        if (!matchesKeywords(j.title, ctx.keywords)) continue;

        const location = j.locationName ?? j.location ?? (j.isRemote ? "Remote" : "Unspecified");
        if (!locationLooksOk(location, ctx, j.isRemote)) continue;

        const description = j.descriptionPlain ?? stripHtml(j.descriptionHtml ?? "");
        out.push({
          title: j.title,
          company: board.name,
          location,
          description,
          sourceUrl: j.jobUrl ?? j.applicationLink ?? "",
          source: "ashby",
          postedAt: j.publishedDate ? new Date(j.publishedDate) : j.updatedAt ? new Date(j.updatedAt) : null,
          employment: mapEmployment(j.employmentType),
          jobType: j.isRemote ? "remote" : null,
          industry: j.department ?? j.team ?? null,
        });
      }
    } catch {
      // skip
    }
  }

  return out;
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function mapEmployment(t?: string): string | null {
  if (!t) return null;
  const x = t.toLowerCase();
  if (x.includes("full")) return "fulltime";
  if (x.includes("part")) return "parttime";
  if (x.includes("contract") || x.includes("temp")) return "contract";
  return null;
}

function locationLooksOk(location: string, ctx: SourceContext, isRemote?: boolean) {
  const loc = location.toLowerCase();
  if (ctx.remote && (isRemote || /remote|anywhere|north america/.test(loc))) return true;
  if (/canada|ontario|toronto|vancouver|montreal|calgary|ottawa|waterloo|halifax|edmonton|quebec/.test(loc)) return true;
  const target = ctx.location.split(",")[0].trim().toLowerCase();
  return target.length > 0 && loc.includes(target);
}
