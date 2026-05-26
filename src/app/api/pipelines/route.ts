import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expandKeyword } from "@/lib/anthropic";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const pipelines = await db.pipeline.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: false,
      pipelineJobs: {
        select: { stage: true },
      },
    },
  });

  return NextResponse.json(
    pipelines.map((p) => ({
      ...p,
      canonicalTitles: JSON.parse(p.canonicalTitles) as string[],
      platforms: JSON.parse(p.platforms) as string[],
      autoApplyTimes: JSON.parse(p.autoApplyTimes) as string[],
      _count: {
        search: p.pipelineJobs.filter((j) => j.stage === "search").length,
        shortlist: p.pipelineJobs.filter((j) => j.stage === "shortlist").length,
      },
      pipelineJobs: undefined,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, keyword, platforms } = body as {
    name: string;
    keyword: string;
    platforms: string[];
  };

  if (!name?.trim() || !keyword?.trim() || !platforms?.length) {
    return NextResponse.json({ error: "name, keyword, and platforms are required" }, { status: 400 });
  }

  const canonicalTitles = await expandKeyword(keyword.trim());

  const pipeline = await db.pipeline.create({
    data: {
      name: name.trim(),
      keyword: keyword.trim(),
      canonicalTitles: JSON.stringify(canonicalTitles),
      platforms: JSON.stringify(platforms),
    },
  });

  await log({
    level: "info",
    category: "system",
    pipelineId: pipeline.id,
    message: `Pipeline '${name}' created with keyword '${keyword}' on ${platforms.length} platforms`,
  });

  return NextResponse.json({
    ...pipeline,
    canonicalTitles,
    platforms,
    autoApplyTimes: [],
    _count: { search: 0, shortlist: 0 },
  });
}
