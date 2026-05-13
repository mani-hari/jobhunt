import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { canonicalTitles } = (await req.json()) as { canonicalTitles?: string[] };
  if (!Array.isArray(canonicalTitles))
    return NextResponse.json({ error: "canonicalTitles must be an array" }, { status: 400 });
  const updated = await prisma.keyword.update({
    where: { id: params.id },
    data: { canonicalTitles: JSON.stringify(canonicalTitles) },
  });
  return NextResponse.json({
    id: updated.id,
    original: updated.original,
    canonicalTitles,
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.keyword.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
