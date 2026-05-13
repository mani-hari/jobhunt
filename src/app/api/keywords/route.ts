import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { geminiJson, isGeminiConfigured } from "@/lib/gemini";

export const dynamic = "force-dynamic";

const EXPAND_PROMPT = (kw: string) => `You are a job title expert for the Canadian job market.
Given the job title keyword: "${kw}"
Return a JSON array of 4-8 closely related job titles that would
appear in real job postings. Stay NARROW and PRACTICAL — only titles
that a recruiter would consider equivalent or very close.

Do NOT include:
- Senior/Junior/Lead variants (we handle seniority separately)
- Titles from completely different career tracks
- Generic titles like "Analyst" alone

Example: "Business Analyst" → ["Business Systems Analyst", "Business Data Analyst", "Business Intelligence Analyst", "BA - Business Analysis", "Business Process Analyst"]

Return ONLY the JSON array, no other text.`;

async function expand(kw: string): Promise<string[]> {
  if (!isGeminiConfigured()) return [kw];
  try {
    const arr = await geminiJson<string[]>(EXPAND_PROMPT(kw));
    return Array.isArray(arr) ? arr.slice(0, 8) : [kw];
  } catch {
    return [kw];
  }
}

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
  const titles = await expand(trimmed);
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
