import { NormalizedJob, PlatformKey } from "@/lib/types";
import { FetchContext } from "./index";

// Playwright-based scrapers. These run via @sparticuz/chromium in Vercel
// serverless functions. Phase 5 implementation.

export async function fetchPlaywright(
  platform: Extract<PlatformKey, "wellfound" | "builtin" | "dynamitejobs">,
  ctx: FetchContext
): Promise<NormalizedJob[]> {
  // Delegate to the Playwright API route which has the browser bundled
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/playwright/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, keywords: ctx.keywords, limit: ctx.limit }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { jobs: NormalizedJob[] };
    return data.jobs ?? [];
  } catch {
    return [];
  }
}
