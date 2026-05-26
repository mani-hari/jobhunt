import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const applications = await db.pipelineJob.findMany({
    where: { stage: "shortlist" },
    include: {
      job: {
        select: {
          title: true, company: true, location: true,
          score: true, source: true, sourceUrl: true,
        },
      },
      pipeline: { select: { id: true, name: true } },
    },
    orderBy: [{ appliedAt: "desc" }, { shortlistedAt: "desc" }],
    take: 200,
  });

  return NextResponse.json(applications);
}
