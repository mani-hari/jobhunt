import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expandKeyword } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.keyword.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    items.map((k) => ({
      id: k.id,
      original: k.original,
      canonicalTitles: JSON.parse(k.canonicalTitles) as string[],
      createdAt: k.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const { original } = (await req.json()) as { original?: string };
  const trimmed = (original ?? "").trim();
  if (!trimmed) return NextResponse.json({ error: "Keyword required" }, { status: 400 });
  const titles = await expandKeyword(trimmed);
  const created = await prisma.keyword.create({
    data: { original: trimmed, canonicalTitles: JSON.stringify(titles) },
  });
  return NextResponse.json({
    id: created.id,
    original: created.original,
    canonicalTitles: titles,
    createdAt: created.createdAt,
  });
}
