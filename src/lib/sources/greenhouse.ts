import { NormalizedJob } from "@/lib/types";
import { FetchContext } from "./index";
import { matchesKeywords } from "./match";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  location?: { name?: string };
  content?: string;
  departments?: Array<{ name: string }>;
  offices?: Array<{ name: string; location?: string }>;
}

export async function fetchGreenhouse(
  ctx: FetchContext,
  boards: Array<{ slug: string; name: string }>
): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];

  for (const board of boards) {
    try {
      const u = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.slug)}/jobs?content=true`;
      const r = await fetch(u, { cache: "no-store", headers: { accept: "application/json" } });
      if (!r.ok) continue;
      const data = (await r.json()) as { jobs?: GreenhouseJob[] };

      for (const j of (data.jobs ?? []).slice(0, ctx.limit)) {
        if (!matchesKeywords(j.title, ctx.keywords)) continue;

        const location =
          j.location?.name ??
          j.offices?.[0]?.location ??
          j.offices?.[0]?.name ??
          "Unspecified";

        if (!locationOk(location, ctx)) continue;

        const description = decodeHtml(stripHtml(j.content ?? ""));

        out.push({
          title: j.title,
          company: board.name,
          location,
          description,
          sourceUrl: j.absolute_url,
          source: "greenhouse",
          postedAt: j.updated_at ? new Date(j.updated_at) : undefined,
          jobType: inferJobType(location, description),
          autoApplyEligible: true,
        });
      }
    } catch {
      // skip broken board, continue
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

function inferJobType(location: string, description: string): string | undefined {
  const hay = `${location} ${description}`.toLowerCase();
  if (hay.includes("remote")) return "remote";
  if (hay.includes("hybrid")) return "hybrid";
  return undefined;
}

function locationOk(location: string, ctx: FetchContext) {
  const loc = location.toLowerCase();
  if (ctx.openToRemote && /remote|anywhere|north america|worldwide/.test(loc)) return true;
  if (/canada|ontario|toronto|vancouver|montreal|calgary|ottawa|waterloo|halifax|edmonton|quebec/.test(loc)) return true;
  const target = ctx.location.split(",")[0].trim().toLowerCase();
  return target.length > 0 && loc.includes(target);
}
