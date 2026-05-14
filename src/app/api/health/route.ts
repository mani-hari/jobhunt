import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    db: !!process.env.DATABASE_URL,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    adzuna: !!process.env.ADZUNA_APP_ID && !!process.env.ADZUNA_APP_KEY,
    rapidapi: !!process.env.RAPIDAPI_KEY,
    googleCse: !!process.env.GOOGLE_SEARCH_API_KEY && !!process.env.GOOGLE_SEARCH_ENGINE_ID,
    scoringModel: process.env.ANTHROPIC_SCORING_MODEL ?? "claude-haiku-4-5",
    generationModel: process.env.ANTHROPIC_GENERATION_MODEL ?? "claude-opus-4-7",
  });
}
