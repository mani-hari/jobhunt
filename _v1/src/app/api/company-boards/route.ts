import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ATS = new Set(["greenhouse", "lever", "ashby"]);

export async function GET() {
  const boards = await prisma.companyBoard.findMany({ orderBy: [{ ats: "asc" }, { name: "asc" }] });
  return NextResponse.json(boards);
}

export async function POST(req: Request) {
  const { ats, slug, name } = (await req.json()) as { ats?: string; slug?: string; name?: string };
  if (!ats || !ATS.has(ats)) return NextResponse.json({ error: "ats must be greenhouse|lever|ashby" }, { status: 400 });
  if (!slug?.trim()) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cleanSlug = slug.trim();
  const cleanName = (name?.trim() || cleanSlug).slice(0, 80);

  try {
    const created = await prisma.companyBoard.create({
      data: { ats, slug: cleanSlug, name: cleanName },
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "Board already exists for this ATS" }, { status: 409 });
  }
}
