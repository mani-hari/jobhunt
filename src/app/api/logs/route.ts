import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const level = searchParams.get("level") || undefined;
  const category = searchParams.get("category") || undefined;
  const pipelineId = searchParams.get("pipelineId") || undefined;
  const limit = parseInt(searchParams.get("limit") || "200");

  const logs = await db.log.findMany({
    where: {
      ...(level ? { level } : {}),
      ...(category ? { category } : {}),
      ...(pipelineId ? { pipelineId } : {}),
    },
    include: { pipeline: { select: { name: true } } },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
