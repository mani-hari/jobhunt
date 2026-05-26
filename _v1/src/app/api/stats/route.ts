import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const SHORTLISTED_STATUSES = ["shortlisted", "resume_generated", "applied", "interview", "offer", "hold"];
const APPLIED_STATUSES = ["applied", "interview", "offer"];

export async function GET() {
  const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [total, lastWeek, shortlisted, applied, strongFits] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { OR: [{ postedAt: { gte: since7d } }, { fetchedAt: { gte: since7d } }] } }),
    prisma.job.count({ where: { status: { in: SHORTLISTED_STATUSES } } }),
    prisma.job.count({ where: { status: { in: APPLIED_STATUSES } } }),
    prisma.job.count({ where: { score: { gte: 75 } } }),
  ]);

  return NextResponse.json({ total, lastWeek, shortlisted, applied, strongFits });
}
