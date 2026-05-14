import type { NormalizedJob } from "@/lib/types";
import type { SourceContext } from "./index";
import { matchesKeywords } from "./match";

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
  categories?: {
    location?: string;
    team?: string;
    department?: string;
    commitment?: string;
  };
  workplaceType?: string;
  descriptionPlain?: string;
  description?: string;
}

export async function fetchLever(
  ctx: SourceContext,
  boards: Array<{ slug: string; name: string }>
): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];

  for (const board of boards) {
    try {
      const u = `https://api.lever.co/v0/postings/${encodeURIComponent(board.slug)}?mode=json`;
      const r = await fetch(u, { cache: "no-store", headers: { accept: "application/json" } });
      if (!r.ok) continue;
      const list = (await r.json()) as LeverJob[];

      for (const j of list) {
        if (!matchesKeywords(j.text, ctx.keywords)) continue;

        const location = j.categories?.location ?? "Unspecified";
        if (!locationLooksOk(location, ctx, j.workplaceType)) continue;

        const description = j.descriptionPlain ?? stripHtml(j.description ?? "");
        out.push({
          title: j.text,
          company: board.name,
          location,
          description,
          sourceUrl: j.hostedUrl || j.applyUrl || "",
          source: "lever",
          postedAt: j.createdAt ? new Date(j.createdAt) : null,
          employment: mapCommitment(j.categories?.commitment),
          jobType: mapWorkplace(j.workplaceType, location),
          industry: j.categories?.team ?? j.categories?.department ?? null,
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

function mapCommitment(c?: string): string | null {
  if (!c) return null;
  const x = c.toLowerCase();
  if (x.includes("part")) return "parttime";
  if (x.includes("contract") || x.includes("temp")) return "contract";
  if (x.includes("full")) return "fulltime";
  return null;
}

function mapWorkplace(w: string | undefined, location: string): string | null {
  if (w === "remote") return "remote";
  if (w === "hybrid") return "hybrid";
  if (w === "on-site" || w === "onsite") return "onsite";
  if (/remote/i.test(location)) return "remote";
  return null;
}

function locationLooksOk(location: string, ctx: SourceContext, workplace?: string) {
  const loc = location.toLowerCase();
  if (ctx.remote && (workplace === "remote" || /remote|anywhere|north america/.test(loc))) return true;
  if (/canada|ontario|toronto|vancouver|montreal|calgary|ottawa|waterloo|halifax|edmonton|quebec/.test(loc)) return true;
  const target = ctx.location.split(",")[0].trim().toLowerCase();
  return target.length > 0 && loc.includes(target);
}
