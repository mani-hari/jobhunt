import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { applyViaGreenhouseAPI, applyViaLeverAPI } from "@/lib/apply/ats";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Called by Vercel Cron every 30 minutes.
// Checks which pipelines have autoApply enabled and whether current Toronto
// time falls within 30 minutes of any selected time slot.

export async function GET() {
  const now = new Date();
  const torontoTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const [currentHour, currentMinute] = torontoTime.split(":").map(Number);
  const currentMinutes = currentHour * 60 + currentMinute;

  const pipelines = await db.pipeline.findMany({
    where: { autoApply: true },
  });

  const settings = await db.settings.findUnique({ where: { id: "singleton" } });

  let totalApplied = 0;
  let totalFailed = 0;
  const pipelinesRun: string[] = [];

  for (const pipeline of pipelines) {
    const times = JSON.parse(pipeline.autoApplyTimes) as string[];
    if (!times.length) continue;

    // Check if any selected time is within 30 minutes of now
    const shouldRun = times.some((t) => {
      const [h, m] = t.split(":").map(Number);
      const slotMinutes = h * 60 + m;
      const diff = Math.abs(currentMinutes - slotMinutes);
      return diff <= 29;
    });

    if (!shouldRun) continue;
    pipelinesRun.push(pipeline.name);

    // Find eligible pipeline jobs
    const eligible = await db.pipelineJob.findMany({
      where: {
        pipelineId: pipeline.id,
        stage: "shortlist",
        assetStatus: "ready",
        applyStatus: null,
        job: { autoApplyEligible: true },
      },
      include: { job: true },
    });

    for (const pj of eligible) {
      await db.pipelineJob.update({
        where: { id: pj.id },
        data: { applyStatus: "applying", applyMethod: "auto" },
      });

      try {
        let result: { success: boolean; error?: string };
        if (pj.job.source === "greenhouse") {
          result = await applyViaGreenhouseAPI(pj.job, settings);
        } else if (pj.job.source === "lever") {
          result = await applyViaLeverAPI(pj.job, settings);
        } else {
          result = { success: false, error: "Unsupported source" };
        }

        if (result.success) {
          await db.pipelineJob.update({
            where: { id: pj.id },
            data: { applyStatus: "applied", appliedAt: new Date() },
          });
          totalApplied++;
        } else {
          await db.pipelineJob.update({
            where: { id: pj.id },
            data: { applyStatus: "failed", applyError: result.error },
          });
          totalFailed++;
          await log({
            level: "error",
            category: "apply",
            pipelineId: pipeline.id,
            jobTitle: pj.job.title,
            message: `Auto-apply failed for ${pj.job.title} at ${pj.job.company}`,
            detail: result.error,
          });
        }
      } catch (err) {
        totalFailed++;
        const msg = err instanceof Error ? err.message : String(err);
        await db.pipelineJob.update({
          where: { id: pj.id },
          data: { applyStatus: "failed", applyError: msg },
        });
      }
    }
  }

  const summary =
    pipelinesRun.length > 0
      ? `Scheduled run at ${torontoTime} ET — ${pipelinesRun.length} pipeline(s): ${totalApplied} applied, ${totalFailed} failed`
      : `Scheduled run at ${torontoTime} ET — no eligible jobs found`;

  await log({
    level: totalFailed > 0 ? "warn" : "info",
    category: "schedule",
    message: summary,
  });

  return NextResponse.json({ ok: true, applied: totalApplied, failed: totalFailed });
}
