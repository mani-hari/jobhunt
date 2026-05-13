import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchAllSources } from "@/lib/sources";
import { dedupeHash } from "@/lib/hash";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const [keywords, settings] = await Promise.all([
    prisma.keyword.findMany(),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  const expanded = keywords.flatMap((k) => {
    const titles = JSON.parse(k.canonicalTitles) as string[];
    return [k.original, ...titles];
  });
  const uniq = Array.from(new Set(expanded.map((s) => s.trim()).filter(Boolean)));

  const fetched = await fetchAllSources({
    keywords: uniq,
    location: settings?.preferredLocation ?? "Toronto, Canada",
    remote: settings?.openToRemote ?? true,
  });

  let inserted = 0;
  let skipped = 0;

  for (const job of fetched) {
    const hash = dedupeHash(job.title, job.company, job.location);
    try {
      await prisma.job.create({
        data: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          jobType: job.jobType ?? null,
          employment: job.employment ?? null,
          level: job.level ?? null,
          industry: job.industry ?? null,
          salaryMin: job.salaryMin ?? null,
          salaryMax: job.salaryMax ?? null,
          sourceUrl: job.sourceUrl,
          source: job.source,
          postedAt: job.postedAt ?? null,
          dedupeHash: hash,
        },
      });
      inserted++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({
    inserted,
    skipped,
    fetched: fetched.length,
    keywordsUsed: uniq.length,
  });
}
