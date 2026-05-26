import { db } from "@/lib/db";
import { generateJobAssets } from "@/lib/anthropic";
import { log } from "@/lib/logger";

export async function generateAssetsForPipelineJob(pjId: string): Promise<void> {
  const pj = await db.pipelineJob.findUnique({
    where: { id: pjId },
    include: { job: true, pipeline: true },
  });
  if (!pj) throw new Error(`PipelineJob ${pjId} not found`);

  await db.pipelineJob.update({ where: { id: pjId }, data: { assetStatus: "generating" } });

  try {
    const [resume, settings] = await Promise.all([
      db.resume.findFirst({ orderBy: { uploadedAt: "desc" } }),
      db.settings.findUnique({ where: { id: "singleton" } }),
    ]);

    if (!resume?.rawText) {
      throw new Error("No resume uploaded. Upload a resume in Settings first.");
    }

    const keyStrengths = settings?.keyStrengths ? JSON.parse(settings.keyStrengths) as string[] : [];
    const start = Date.now();

    const assets = await generateJobAssets({
      jobTitle: pj.job.title,
      company: pj.job.company,
      jobDescription: pj.job.description,
      candidateResume: resume.rawText,
      careerGapNote: settings?.careerGapNote ?? "",
      keyStrengths,
      firstName: settings?.firstName,
      lastName: settings?.lastName,
      email: settings?.email,
      phone: settings?.phone,
      linkedInUrl: settings?.linkedInUrl,
    });

    await db.pipelineJob.update({
      where: { id: pjId },
      data: {
        generatedResume: assets.resume,
        generatedCover: assets.coverLetter,
        fitSummary: assets.fitSummary,
        assetStatus: "ready",
      },
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    await log({
      level: "info",
      category: "generate",
      pipelineId: pj.pipelineId,
      jobTitle: pj.job.title,
      message: `Generated resume + cover for ${pj.job.title} at ${pj.job.company} (${elapsed}s)`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.pipelineJob.update({
      where: { id: pjId },
      data: { assetStatus: "failed" },
    });
    await log({
      level: "error",
      category: "generate",
      pipelineId: pj.pipelineId,
      jobTitle: pj.job.title,
      message: `Generation failed for ${pj.job.title} at ${pj.job.company}`,
      detail: msg,
    });
    throw err;
  }
}
