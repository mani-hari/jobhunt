import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { jobIds } = await req.json() as { jobIds: string[] };
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return NextResponse.json({ error: "jobIds required" }, { status: 400 });
  }

  const pipeline = await db.pipeline.findUnique({ where: { id: params.id } });
  if (!pipeline) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated: string[] = [];
  for (const jobId of jobIds) {
    try {
      await db.pipelineJob.update({
        where: { pipelineId_jobId: { pipelineId: params.id, jobId } },
        data: {
          stage: "shortlist",
          shortlistedAt: new Date(),
          shortlistedHow: "manual",
          assetStatus: "pending",
        },
      });
      updated.push(jobId);
    } catch {
      // not found — skip
    }
  }

  if (updated.length > 0) {
    await log({
      level: "info",
      category: "system",
      pipelineId: params.id,
      message: `${updated.length} job(s) shortlisted manually`,
    });
  }

  return NextResponse.json({ shortlisted: updated.length });
}
