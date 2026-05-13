import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    db: !!process.env.DATABASE_URL,
    gemini: !!process.env.GEMINI_API_KEY,
    adzuna: !!process.env.ADZUNA_APP_ID && !!process.env.ADZUNA_APP_KEY,
    rapidapi: !!process.env.RAPIDAPI_KEY,
  });
}
