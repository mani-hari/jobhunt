import { NormalizedJob } from "@/lib/types";
import { FetchContext } from "./index";
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
    commitment?: string;
  };
  workplaceType?: string;
  descriptionPlain?: string;
  description?: string;
}

export async function fetchLever(
  ctx: FetchContext,
  boards: Array<{ slug: string; name: string }>
): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];

  for (const board of boards) {
    try {
      const u = `https://api.lever.co/v0/postings/${encodeURIComponent(board.slug)}?mode=json`;
      const r = await fetch(u, { cache: "no-store", headers: { accept: "application/json" } });
      if (!r.ok) continue;
      const list = (await r.json()) as LeverJob[];

      for (const j of list.slice(0, ctx.limit)) {
        if (!matchesKeywords(j.text, ctx.keywords)) continue;
        const location = j.categories?.location ?? "Unspecified";
        if (!locationOk(location, ctx, j.workplaceType)) continue;

        const description = j.descriptionPlain ?? stripHtml(j.description ?? "");
        out.push({
          title: j.text,
          company: board.name,
          location,
          description,
          sourceUrl: j.hostedUrl || j.applyUrl || "",
          source: "lever",
          postedAt: j.createdAt ? new Date(j.createdAt) : undefined,
          employment: mapCommitment(j.categories?.commitment),
          jobType: mapWorkplace(j.workplaceType, location),
          autoApplyEligible: true,
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

function mapCommitment(c?: string): string | undefined {
  if (!c) return undefined;
  const x = c.toLowerCase();
  if (x.includes("part")) return "parttime";
  if (x.includes("contract") || x.includes("temp")) return "contract";
  if (x.includes("full")) return "fulltime";
  return undefined;
}

function mapWorkplace(w: string | undefined, location: string): string | undefined {
  if (w === "remote") return "remote";
  if (w === "hybrid") return "hybrid";
  if (w === "on-site" || w === "onsite") return "onsite";
  if (/remote/i.test(location)) return "remote";
  return undefined;
}

function locationOk(location: string, ctx: FetchContext, workplace?: string) {
  const loc = location.toLowerCase();
  if (ctx.openToRemote && (workplace === "remote" || /remote|anywhere|north america/.test(loc))) return true;
  if (/canada|ontario|toronto|vancouver|montreal|calgary|ottawa|waterloo|halifax|edmonton|quebec/.test(loc)) return true;
  const target = ctx.location.split(",")[0].trim().toLowerCase();
  return target.length > 0 && loc.includes(target);
}
