import { NextResponse } from "next/server";
import { scoreUnscoredJobs } from "@/lib/ai/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // up to 5 minutes for large batches

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(200, Math.max(1, Number(limitParam) || 50)) : 50;

  try {
    const result = await scoreUnscoredJobs(limit);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
