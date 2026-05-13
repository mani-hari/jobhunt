import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const RANGES: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "7w": 49,
  all: 0,
};

function csvList(v: string | null): string[] | undefined {
  if (!v) return undefined;
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const range = searchParams.get("range") ?? "7d";
  const status = searchParams.get("status"); // "shortlisted", "applied", etc.
  const minScore = searchParams.get("minScore");
  const types = csvList(searchParams.get("type"));
  const employments = csvList(searchParams.get("employment"));
  const levels = csvList(searchParams.get("level"));
  const industries = csvList(searchParams.get("industry"));
  const sources = csvList(searchParams.get("source"));

  const where: Record<string, unknown> = {};

  if (RANGES[range] && RANGES[range] > 0) {
    const since = new Date(Date.now() - RANGES[range] * 24 * 3600 * 1000);
    where.OR = [{ postedAt: { gte: since } }, { fetchedAt: { gte: since } }];
  }

  if (status) {
    if (status === "active") {
      where.status = { in: ["shortlisted", "resume_generated", "applied", "interview", "offer", "hold"] };
    } else if (status === "applied_pipeline") {
      where.status = { in: ["resume_generated", "applied", "interview", "offer", "rejected", "hold"] };
    } else {
      where.status = status;
    }
  } else {
    // Exclude deleted-by-user jobs from the default feed.
    where.status = { not: "deleted" };
  }

  if (minScore) where.score = { gte: Number(minScore) };
  if (types) where.jobType = { in: types };
  if (employments) where.employment = { in: employments };
  if (levels) where.level = { in: levels };
  if (industries) where.industry = { in: industries };
  if (sources) where.source = { in: sources };

  const jobs = await prisma.job.findMany({
    where,
    orderBy: [{ score: "desc" }, { postedAt: "desc" }, { fetchedAt: "desc" }],
    take: 200,
  });

  return NextResponse.json(jobs);
}
