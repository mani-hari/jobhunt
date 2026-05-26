import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { fetchForPipeline, withHash } from "@/lib/sources/index";
import { scoreJob } from "@/lib/anthropic";
import { PlatformKey } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const pipeline = await db.pipeline.findUnique({ where: { id: params.id } });
  if (!pipeline) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await db.settings.findUnique({ where: { id: "singleton" } });
  const platforms = JSON.parse(pipeline.platforms) as PlatformKey[];
  const keywords = [pipeline.keyword, ...JSON.parse(pipeline.canonicalTitles)] as string[];

  const ctx = {
    keywords,
    location: settings?.preferredLocation ?? "Toronto, Canada",
    openToRemote: settings?.openToRemote ?? true,
    limit: pipeline.fetchLimit,
  };

  const start = Date.now();
  const { results } = await fetchForPipeline(platforms, ctx);

  let newCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (result.error) {
      errorCount++;
      await log({
        level: "error",
        category: "fetch",
        pipelineId: pipeline.id,
        message: `${result.platform} fetch failed: ${result.error}`,
        detail: result.error,
      });
      continue;
    }

    let platformNew = 0;
    for (const raw of result.jobs) {
      const job = withHash(raw);
      try {
        // Upsert job (dedupeHash unique index prevents duplicates)
        const upserted = await db.job.upsert({
          where: { dedupeHash: job.dedupeHash },
          update: {},
          create: {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            jobType: job.jobType,
            employment: job.employment,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            sourceUrl: job.sourceUrl,
            source: job.source,
            postedAt: job.postedAt,
            dedupeHash: job.dedupeHash,
            autoApplyEligible: job.autoApplyEligible,
          },
        });

        // Link to this pipeline if not already linked
        await db.pipelineJob.upsert({
          where: { pipelineId_jobId: { pipelineId: pipeline.id, jobId: upserted.id } },
          update: {},
          create: { pipelineId: pipeline.id, jobId: upserted.id, stage: "search" },
        });

        platformNew++;
      } catch {
        // duplicate or constraint error — skip silently
      }
    }

    newCount += platformNew;
    if (result.jobs.length > 0) {
      await log({
        level: "info",
        category: "fetch",
        pipelineId: pipeline.id,
        message: `Fetched ${result.jobs.length} jobs from ${result.platform} (${platformNew} new)`,
      });
    }
  }

  // Update lastFetchedAt
  await db.pipeline.update({
    where: { id: pipeline.id },
    data: { lastFetchedAt: new Date() },
  });

  // Auto-score unscored jobs for this pipeline
  const unscored = await db.pipelineJob.findMany({
    where: { pipelineId: pipeline.id, job: { score: null } },
    include: { job: true },
    take: 30,
  });

  const keyStrengths = settings?.keyStrengths ? JSON.parse(settings.keyStrengths) as string[] : [];
  const preferredIndustries = settings?.preferredIndustries ? JSON.parse(settings.preferredIndustries) as string[] : [];
  let scored = 0;

  for (const pj of unscored) {
    try {
      const result = await scoreJob({
        title: pj.job.title,
        company: pj.job.company,
        location: pj.job.location,
        jobType: pj.job.jobType,
        employment: pj.job.employment,
        description: pj.job.description,
        preferredLocation: settings?.preferredLocation ?? "Toronto, Canada",
        openToRemote: settings?.openToRemote ?? true,
        yearsExperience: settings?.yearsExperience ?? 7,
        preferredIndustries,
        keyStrengths,
        careerGapNote: settings?.careerGapNote ?? "",
        dealBreakers: settings?.dealBreakers,
      });

      await db.job.update({
        where: { id: pj.job.id },
        data: { score: result.score, scoreSummary: result.summary },
      });
      scored++;
    } catch {
      // scoring is best-effort
    }
  }

  if (scored > 0) {
    await log({
      level: "info",
      category: "score",
      pipelineId: pipeline.id,
      message: `Scored ${scored} jobs via Claude API`,
    });
  }

  // Auto-shortlist Greenhouse/Lever jobs if toggle is on
  if (pipeline.autoShortlist) {
    const eligible = await db.pipelineJob.findMany({
      where: {
        pipelineId: pipeline.id,
        stage: "search",
        job: { autoApplyEligible: true },
      },
      include: { job: true },
    });

    for (const pj of eligible) {
      await db.pipelineJob.update({
        where: { id: pj.id },
        data: { stage: "shortlist", shortlistedAt: new Date(), shortlistedHow: "auto" },
      });
    }

    if (eligible.length > 0) {
      await log({
        level: "info",
        category: "fetch",
        pipelineId: pipeline.id,
        message: `Auto-shortlisted ${eligible.length} Greenhouse/Lever jobs`,
      });
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  return NextResponse.json({
    fetched: newCount,
    scored,
    errors: errorCount,
    elapsed: `${elapsed}s`,
  });
}
