import { NextResponse } from "next/server";
import { generateApplicationMaterials } from "@/lib/ai/generate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await generateApplicationMaterials(params.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
