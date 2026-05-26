import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { searchParams } = req.nextUrl;
  const stage = searchParams.get("stage") || undefined;
  const scoreMin = parseInt(searchParams.get("scoreMin") || "0");
  const jobType = searchParams.get("jobType") || undefined;
  const employment = searchParams.get("employment") || undefined;

  const pipelineJobs = await db.pipelineJob.findMany({
    where: {
      pipelineId: params.id,
      ...(stage ? { stage } : {}),
    },
    include: {
      job: true,
    },
    orderBy: [
      { shortlistedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  let results = pipelineJobs;
  if (scoreMin > 0) results = results.filter((pj) => (pj.job.score ?? 0) >= scoreMin);
  if (jobType) results = results.filter((pj) => pj.job.jobType === jobType);
  if (employment) results = results.filter((pj) => pj.job.employment === employment);

  return NextResponse.json(results);
}
