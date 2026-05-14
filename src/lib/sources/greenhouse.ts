import type { NormalizedJob } from "@/lib/types";
import type { SourceContext } from "./index";
import { matchesKeywords } from "./match";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  location?: { name?: string };
  content?: string; // sometimes returned with ?content=true
  departments?: Array<{ name: string }>;
  offices?: Array<{ name: string; location?: string }>;
}

interface GreenhouseDetail {
  content?: string;
  metadata?: Array<{ name: string; value: string }>;
}

export async function fetchGreenhouse(
  ctx: SourceContext,
  boards: Array<{ slug: string; name: string }>
): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];

  for (const board of boards) {
    try {
      const u = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.slug)}/jobs?content=true`;
      const r = await fetch(u, { cache: "no-store", headers: { accept: "application/json" } });
      if (!r.ok) continue;
      const data = (await r.json()) as { jobs?: GreenhouseJob[] };

      for (const j of data.jobs ?? []) {
        if (!matchesKeywords(j.title, ctx.keywords)) continue;

        const location =
          j.location?.name ??
          j.offices?.[0]?.location ??
          j.offices?.[0]?.name ??
          "Unspecified";

        const description = decodeHtml(stripHtml(j.content ?? ""));
        if (!locationLooksOk(location, ctx)) continue;

        out.push({
          title: j.title,
          company: board.name,
          location,
          description,
          sourceUrl: j.absolute_url,
          source: "greenhouse",
          postedAt: j.updated_at ? new Date(j.updated_at) : null,
          jobType: inferRemote(location, description),
          industry: j.departments?.[0]?.name ?? null,
        });
      }
    } catch {
      // skip a broken board, keep going
    }
  }

  return out;
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function inferRemote(location: string, description: string): string | null {
  const hay = `${location} ${description}`.toLowerCase();
  if (hay.includes("remote")) return "remote";
  if (hay.includes("hybrid")) return "hybrid";
  return null;
}

function locationLooksOk(location: string, ctx: SourceContext) {
  const loc = location.toLowerCase();
  if (ctx.remote && /remote|anywhere|north america/.test(loc)) return true;
  // Match Canadian cities or generic Canada mentions; loose match on user's location.
  if (/canada|ontario|toronto|vancouver|montreal|calgary|ottawa|waterloo|halifax|edmonton|quebec/.test(loc)) return true;
  const target = ctx.location.split(",")[0].trim().toLowerCase();
  return target.length > 0 && loc.includes(target);
}
