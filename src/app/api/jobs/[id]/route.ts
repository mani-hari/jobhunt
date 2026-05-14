import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { JobStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as { status?: JobStatus };
  const update: Record<string, unknown> = {};

  if (body.status) {
    update.status = body.status;
    if (body.status === "shortlisted") update.shortlistedAt = new Date();
    if (body.status === "applied") update.appliedAt = new Date();
  }

  const job = await prisma.job.update({ where: { id: params.id }, data: update });
  return NextResponse.json(job);
}
