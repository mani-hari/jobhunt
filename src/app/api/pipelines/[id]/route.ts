import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expandKeyword } from "@/lib/anthropic";
import { log } from "@/lib/logger";

type Ctx = { params: { id: string } };

async function getPipeline(id: string) {
  return db.pipeline.findUnique({
    where: { id },
    include: { pipelineJobs: { select: { stage: true } } },
  });
}

function serialize(p: NonNullable<Awaited<ReturnType<typeof getPipeline>>>) {
  return {
    ...p,
    canonicalTitles: JSON.parse(p.canonicalTitles) as string[],
    platforms: JSON.parse(p.platforms) as string[],
    autoApplyTimes: JSON.parse(p.autoApplyTimes) as string[],
    _count: {
      search: p.pipelineJobs.filter((j) => j.stage === "search").length,
      shortlist: p.pipelineJobs.filter((j) => j.stage === "shortlist").length,
    },
    pipelineJobs: undefined,
  };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const p = await getPipeline(params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serialize(p));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json();
  const existing = await db.pipeline.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const keywordChanged =
    body.keyword && body.keyword.trim() !== existing.keyword;

  let canonicalTitles: string[] | undefined;
  if (keywordChanged) {
    // Caller must confirm before sending — clear all jobs for this pipeline
    await db.pipelineJob.deleteMany({ where: { pipelineId: params.id } });
    canonicalTitles = await expandKeyword(body.keyword.trim());
    await log({
      level: "info",
      category: "system",
      pipelineId: params.id,
      message: `Pipeline keyword changed to '${body.keyword}' — all jobs cleared`,
    });
  }

  const updated = await db.pipeline.update({
    where: { id: params.id },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(keywordChanged
        ? {
            keyword: body.keyword.trim(),
            canonicalTitles: JSON.stringify(canonicalTitles),
            lastFetchedAt: null,
          }
        : {}),
      ...(body.platforms !== undefined ? { platforms: JSON.stringify(body.platforms) } : {}),
      ...(body.autoShortlist !== undefined ? { autoShortlist: body.autoShortlist } : {}),
      ...(body.autoApply !== undefined ? { autoApply: body.autoApply } : {}),
      ...(body.autoApplyTimes !== undefined
        ? { autoApplyTimes: JSON.stringify(body.autoApplyTimes) }
        : {}),
      ...(body.fetchLimit !== undefined ? { fetchLimit: body.fetchLimit } : {}),
    },
    include: { pipelineJobs: { select: { stage: true } } },
  });

  return NextResponse.json(serialize(updated));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const existing = await db.pipeline.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const jobCount = await db.pipelineJob.count({ where: { pipelineId: params.id } });
  await db.pipeline.delete({ where: { id: params.id } });

  await log({
    level: "info",
    category: "system",
    message: `Pipeline '${existing.name}' deleted — ${jobCount} jobs removed`,
  });

  return NextResponse.json({ deleted: true });
}
