import { NextResponse } from "next/server";
import { scoreJobById } from "@/lib/ai/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await scoreJobById(params.id);
    if (!result) {
      return NextResponse.json(
        { error: "Scoring unavailable — set GEMINI_API_KEY or check that the job exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
