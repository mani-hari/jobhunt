import type { NormalizedJob } from "@/lib/types";
import type { SourceContext } from "./index";

interface CSEItem {
  title: string;
  link: string;
  snippet?: string;
  displayLink?: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
    jobposting?: Array<{
      title?: string;
      hiringorganization?: string;
      joblocation?: string;
      datePosted?: string;
      description?: string;
    }>;
  };
}

// Google Programmable Search has a 100 query/day free quota.
// We fan out across the user's keywords but cap aggressively.
const SITE_FILTER = "(site:linkedin.com/jobs OR site:indeed.ca OR site:ca.indeed.com OR site:workday.com OR site:glassdoor.ca)";

export async function fetchGoogleCse(ctx: SourceContext): Promise<NormalizedJob[]> {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!key || !cx) return [];

  const out: NormalizedJob[] = [];
  const seen = new Set<string>();

  // Cap to 4 keywords per refresh to stay within free quota.
  for (const kw of ctx.keywords.slice(0, 4)) {
    const q = `"${kw}" "${ctx.location.split(",")[0]}" ${SITE_FILTER}`;
    const u = new URL("https://www.googleapis.com/customsearch/v1");
    u.searchParams.set("key", key);
    u.searchParams.set("cx", cx);
    u.searchParams.set("q", q);
    u.searchParams.set("num", "10");
    u.searchParams.set("dateRestrict", "m1"); // last month

    try {
      const r = await fetch(u, { cache: "no-store" });
      if (!r.ok) continue;
      const data = (await r.json()) as { items?: CSEItem[] };

      for (const item of data.items ?? []) {
        if (seen.has(item.link)) continue;
        seen.add(item.link);

        const jp = item.pagemap?.jobposting?.[0];
        const company =
          jp?.hiringorganization ||
          parseCompanyFromMetatag(item.pagemap?.metatags) ||
          parseCompanyFromTitle(item.title) ||
          item.displayLink ||
          "Unknown";

        out.push({
          title: cleanTitle(jp?.title || item.title),
          company,
          location: jp?.joblocation || ctx.location,
          description: jp?.description || item.snippet || "",
          sourceUrl: item.link,
          source: "google",
          postedAt: jp?.datePosted ? safeDate(jp.datePosted) : null,
        });
      }
    } catch {
      // skip and try next keyword
    }
  }

  return out;
}

function safeDate(s: string): Date | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function cleanTitle(t: string) {
  // Strip site suffixes like " - LinkedIn" or " | Indeed.com"
  return t.replace(/\s*[-|·]\s*(LinkedIn|Indeed.*|Glassdoor|Workday).*$/i, "").trim();
}

function parseCompanyFromTitle(t: string): string | null {
  // Many LinkedIn job titles are "Title - Company - LinkedIn"
  const parts = t.split(/\s+[-|·]\s+/);
  if (parts.length >= 3) return parts[1].trim();
  return null;
}

function parseCompanyFromMetatag(metatags?: Array<Record<string, string>>): string | null {
  if (!metatags) return null;
  for (const m of metatags) {
    const c = m["og:site_name"] || m["twitter:site"];
    if (c) return c;
  }
  return null;
}
