import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string; pjId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const pj = await db.pipelineJob.findUnique({
    where: { id: params.pjId },
    include: { job: true },
  });
  if (!pj || pj.pipelineId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(pj);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json();
  const pj = await db.pipelineJob.update({
    where: { id: params.pjId },
    data: body,
    include: { job: true },
  });
  return NextResponse.json(pj);
}
