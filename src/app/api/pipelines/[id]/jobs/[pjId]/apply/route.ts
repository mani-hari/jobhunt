import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { applyViaGreenhouseAPI, applyViaLeverAPI } from "@/lib/apply/ats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: { id: string; pjId: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const pj = await db.pipelineJob.findUnique({
    where: { id: params.pjId },
    include: { job: true, pipeline: true },
  });

  if (!pj) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pj.assetStatus !== "ready") {
    return NextResponse.json({ error: "Assets not ready yet" }, { status: 400 });
  }
  if (!pj.job.autoApplyEligible) {
    return NextResponse.json({ error: "This job requires manual application" }, { status: 400 });
  }

  // Mark as applying
  await db.pipelineJob.update({
    where: { id: pj.id },
    data: { applyStatus: "applying", applyMethod: "auto" },
  });

  try {
    const settings = await db.settings.findUnique({ where: { id: "singleton" } });

    let result: { success: boolean; error?: string };
    if (pj.job.source === "greenhouse") {
      result = await applyViaGreenhouseAPI(pj.job, settings);
    } else if (pj.job.source === "lever") {
      result = await applyViaLeverAPI(pj.job, settings);
    } else {
      result = { success: false, error: "Unsupported source for auto-apply" };
    }

    if (result.success) {
      await db.pipelineJob.update({
        where: { id: pj.id },
        data: { applyStatus: "applied", appliedAt: new Date() },
      });
      await log({
        level: "info",
        category: "apply",
        pipelineId: pj.pipelineId,
        jobTitle: pj.job.title,
        message: `Auto-applied to ${pj.job.title} at ${pj.job.company} via ${pj.job.source}`,
      });
      return NextResponse.json({ status: "applied" });
    } else {
      await db.pipelineJob.update({
        where: { id: pj.id },
        data: { applyStatus: "failed", applyError: result.error },
      });
      await log({
        level: "error",
        category: "apply",
        pipelineId: pj.pipelineId,
        jobTitle: pj.job.title,
        message: `Auto-apply failed for ${pj.job.title} at ${pj.job.company}`,
        detail: result.error,
      });
      return NextResponse.json({ status: "failed", error: result.error }, { status: 500 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.pipelineJob.update({
      where: { id: pj.id },
      data: { applyStatus: "failed", applyError: msg },
    });
    await log({
      level: "error",
      category: "apply",
      pipelineId: pj.pipelineId,
      jobTitle: pj.job.title,
      message: `Auto-apply error for ${pj.job.title} at ${pj.job.company}`,
      detail: msg,
    });
    return NextResponse.json({ status: "failed", error: msg }, { status: 500 });
  }
}
