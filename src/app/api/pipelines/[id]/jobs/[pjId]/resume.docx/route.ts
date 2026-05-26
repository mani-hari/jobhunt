import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDocx, makeDocxFileName } from "@/lib/ai/docx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string; pjId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const pj = await db.pipelineJob.findUnique({
    where: { id: params.pjId },
    include: { job: true },
  });

  if (!pj || !pj.generatedResume) {
    return NextResponse.json({ error: "Resume not generated yet" }, { status: 404 });
  }

  const settings = await db.settings.findUnique({ where: { id: "singleton" } });
  const fileName = makeDocxFileName(settings?.firstName ?? null, settings?.lastName ?? null, pj.job.company);

  const buffer = await buildDocx(pj.generatedResume, fileName);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
