import { NextRequest, NextResponse } from "next/server";
import { generateAssetsForPipelineJob } from "@/lib/ai/generate";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: { id: string; pjId: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    await generateAssetsForPipelineJob(params.pjId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
