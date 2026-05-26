import { NextRequest, NextResponse } from "next/server";
import { NormalizedJob, PlatformKey } from "@/lib/types";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
export const runtime = "nodejs";

type RequestBody = {
  platform: Extract<PlatformKey, "wellfound" | "builtin" | "dynamitejobs">;
  keywords: string[];
  limit: number;
};

export async function POST(req: NextRequest) {
  const body = await req.json() as RequestBody;
  const { platform, keywords, limit } = body;

  try {
    const jobs = await scrapeWithPlaywright(platform, keywords, limit);
    return NextResponse.json({ jobs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await log({
      level: "error",
      category: "fetch",
      message: `Playwright scrape failed for ${platform}: ${msg}`,
      detail: msg,
    });
    return NextResponse.json({ jobs: [] });
  }
}

async function scrapeWithPlaywright(
  platform: string,
  keywords: string[],
  limit: number
): Promise<NormalizedJob[]> {
  // Dynamic import to avoid loading chromium on cold starts that don't need it
  const chromium = (await import("@sparticuz/chromium-min")).default;
  const { chromium: playwrightChromium } = await import("playwright-core");

  const executablePath = await chromium.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
  );

  const browser = await playwrightChromium.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });

  try {
    const kw = keywords[0] ?? "";
    switch (platform) {
      case "wellfound":
        return await scrapeWellfound(browser, kw, limit);
      case "builtin":
        return await scrapeBuiltIn(browser, kw, limit);
      case "dynamitejobs":
        return await scrapeDynamiteJobs(browser, kw, limit);
      default:
        return [];
    }
  } finally {
    await browser.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scrapeWellfound(browser: any, keyword: string, limit: number): Promise<NormalizedJob[]> {
  const page = await browser.newPage();
  try {
    const url = `https://wellfound.com/jobs?q=${encodeURIComponent(keyword)}&l=Canada`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("[data-test='JobListing']", { timeout: 15_000 }).catch(() => {});

    const jobs = await page.evaluate((lim: number) => {
      const cards = document.querySelectorAll("[data-test='JobListing']");
      const out: NormalizedJob[] = [];
      cards.forEach((card, i) => {
        if (i >= lim) return;
        const title = card.querySelector("h2")?.textContent?.trim() ?? "";
        const company = card.querySelector("[data-test='startup-link']")?.textContent?.trim() ?? "";
        const location = card.querySelector("[data-test='location']")?.textContent?.trim() ?? "Canada";
        const link = (card.querySelector("a") as HTMLAnchorElement)?.href ?? "";
        if (title) {
          out.push({
            title,
            company,
            location,
            description: "",
            sourceUrl: link,
            source: "wellfound",
            autoApplyEligible: false,
          } as NormalizedJob);
        }
      });
      return out;
    }, limit);

    return jobs;
  } finally {
    await page.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scrapeBuiltIn(browser: any, keyword: string, limit: number): Promise<NormalizedJob[]> {
  const page = await browser.newPage();
  try {
    const url = `https://builtin.com/jobs/canada?search=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("article", { timeout: 15_000 }).catch(() => {});

    const jobs = await page.evaluate((lim: number) => {
      const cards = document.querySelectorAll("article");
      const out: NormalizedJob[] = [];
      cards.forEach((card, i) => {
        if (i >= lim) return;
        const title = card.querySelector("h2")?.textContent?.trim() ?? "";
        const company = card.querySelector("[class*='company']")?.textContent?.trim() ?? "";
        const location = card.querySelector("[class*='location']")?.textContent?.trim() ?? "Canada";
        const link = (card.querySelector("a[href*='/jobs/']") as HTMLAnchorElement)?.href ?? "";
        if (title) {
          out.push({
            title,
            company,
            location,
            description: "",
            sourceUrl: link || "https://builtin.com/jobs/canada",
            source: "builtin",
            autoApplyEligible: false,
          } as NormalizedJob);
        }
      });
      return out;
    }, limit);

    return jobs;
  } finally {
    await page.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scrapeDynamiteJobs(browser: any, keyword: string, limit: number): Promise<NormalizedJob[]> {
  const page = await browser.newPage();
  try {
    const url = `https://www.dynamitejobs.com/remote-jobs?search=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("[class*='job-card']", { timeout: 15_000 }).catch(() => {});

    const jobs = await page.evaluate((lim: number) => {
      const cards = document.querySelectorAll("[class*='job-card']");
      const out: NormalizedJob[] = [];
      cards.forEach((card, i) => {
        if (i >= lim) return;
        const title = card.querySelector("h2, h3")?.textContent?.trim() ?? "";
        const company = card.querySelector("[class*='company']")?.textContent?.trim() ?? "";
        const link = (card.querySelector("a") as HTMLAnchorElement)?.href ?? "";
        if (title) {
          out.push({
            title,
            company,
            location: "Remote",
            description: "",
            sourceUrl: link || "https://www.dynamitejobs.com",
            source: "dynamitejobs",
            jobType: "remote",
            autoApplyEligible: false,
          } as NormalizedJob);
        }
      });
      return out;
    }, limit);

    return jobs;
  } finally {
    await page.close();
  }
}
