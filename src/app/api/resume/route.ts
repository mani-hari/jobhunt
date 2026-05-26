import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const resume = await db.resume.findFirst({ orderBy: { uploadedAt: "desc" } });
  if (!resume) return NextResponse.json(null);
  return NextResponse.json({
    id: resume.id,
    fileName: resume.fileName,
    wordCount: resume.rawText.split(/\s+/).filter(Boolean).length,
    uploadedAt: resume.uploadedAt,
    preview: resume.rawText.slice(0, 600),
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "PDF required" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(buf);
  const rawText = parsed.text.replace(/\s+\n/g, "\n").trim();

  if (!rawText) {
    return NextResponse.json(
      { error: "Couldn't extract text from this PDF. It may be a scanned image." },
      { status: 400 }
    );
  }

  const created = await db.resume.create({
    data: { fileName: file.name, rawText },
  });

  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  await log({
    level: "info",
    category: "system",
    message: `Resume uploaded: ${file.name} (${wordCount} words extracted)`,
  });

  return NextResponse.json({
    id: created.id,
    fileName: created.fileName,
    wordCount,
    uploadedAt: created.uploadedAt,
  });
}
