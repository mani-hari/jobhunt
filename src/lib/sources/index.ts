import { NormalizedJob, PlatformKey } from "@/lib/types";
import { dedupeHash } from "@/lib/hash";
import { fetchGreenhouse } from "./greenhouse";
import { fetchLever } from "./lever";
import { fetchAdzuna } from "./adzuna";
import { fetchJSearch } from "./jsearch";
import { fetchJobBank } from "./jobbank";
import { fetchRemoteOK } from "./remoteok";
import { fetchWeWorkRemotely } from "./weworkremotely";
import { fetchRemotive } from "./remotive";
import { fetchPlaywright } from "./playwright";

export type FetchContext = {
  keywords: string[];   // keyword + canonical titles
  location: string;
  openToRemote: boolean;
  limit: number;
};

type FetchResult = {
  platform: PlatformKey;
  jobs: NormalizedJob[];
  error?: string;
};

// Hardcoded Canadian-relevant company slugs.
// Greenhouse boards: probe with curl https://boards-api.greenhouse.io/v1/boards/<slug>/jobs
const GREENHOUSE_BOARDS = [
  { slug: "shopify", name: "Shopify" },
  { slug: "hootsuite", name: "Hootsuite" },
  { slug: "thinkific", name: "Thinkific" },
  { slug: "later", name: "Later" },
  { slug: "stripe", name: "Stripe" },
  { slug: "airbnb", name: "Airbnb" },
  { slug: "figma", name: "Figma" },
  { slug: "asana", name: "Asana" },
  { slug: "dropbox", name: "Dropbox" },
  { slug: "robinhood", name: "Robinhood" },
  { slug: "klaviyo", name: "Klaviyo" },
  { slug: "airtable", name: "Airtable" },
  { slug: "samsara", name: "Samsara" },
  { slug: "benchsci", name: "BenchSci" },
  { slug: "ritual", name: "Ritual" },
  { slug: "wealthsimple", name: "Wealthsimple" },
  { slug: "clearco", name: "Clearco" },
  { slug: "lifeworks", name: "LifeWorks" },
];

const LEVER_BOARDS = [
  { slug: "metabase", name: "Metabase" },
  { slug: "1password", name: "1Password" },
  { slug: "freshbooks", name: "FreshBooks" },
  { slug: "borealis-ai", name: "Borealis AI" },
  { slug: "cohere", name: "Cohere" },
  { slug: "d2l", name: "D2L" },
];

export async function fetchForPipeline(
  platforms: PlatformKey[],
  ctx: FetchContext
): Promise<{ results: FetchResult[]; total: number }> {
  const tasks: Promise<FetchResult>[] = [];

  for (const platform of platforms) {
    switch (platform) {
      case "greenhouse":
        tasks.push(
          fetchGreenhouse(ctx, GREENHOUSE_BOARDS)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
      case "lever":
        tasks.push(
          fetchLever(ctx, LEVER_BOARDS)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
      case "adzuna":
        tasks.push(
          fetchAdzuna(ctx)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
      case "linkedin":
      case "indeed":
        tasks.push(
          fetchJSearch(ctx, platform)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
      case "jobbank":
        tasks.push(
          fetchJobBank(ctx)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
      case "remoteok":
        tasks.push(
          fetchRemoteOK(ctx)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
      case "weworkremotely":
        tasks.push(
          fetchWeWorkRemotely(ctx.keywords[0] ?? "", ctx.limit)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
      case "remotive":
        tasks.push(
          fetchRemotive(ctx.keywords[0] ?? "", ctx.limit)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
      case "wellfound":
      case "builtin":
      case "dynamitejobs":
        tasks.push(
          fetchPlaywright(platform, ctx)
            .then((jobs) => ({ platform, jobs }))
            .catch((error) => ({ platform, jobs: [], error: String(error) }))
        );
        break;
    }
  }

  const results = await Promise.allSettled(tasks);
  const resolved = results.map((r) =>
    r.status === "fulfilled" ? r.value : { platform: "adzuna" as PlatformKey, jobs: [], error: "Promise rejected" }
  );

  const total = resolved.reduce((sum, r) => sum + r.jobs.length, 0);
  return { results: resolved, total };
}

// Attach dedupeHash to a NormalizedJob before DB insert
export function withHash(job: NormalizedJob): NormalizedJob & { dedupeHash: string } {
  return {
    ...job,
    dedupeHash: dedupeHash(job.title, job.company, job.location),
  };
}
