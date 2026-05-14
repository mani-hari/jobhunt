import { prisma } from "@/lib/db";
import { generateMaterials, isAnthropicConfigured } from "@/lib/anthropic";

export interface MaterialsResult {
  resumeImpact: string;
  resumeSkills: string;
  coverLetter: string;
  outreachEmail: string;
  fitAnalysis: string;
}

export async function generateApplicationMaterials(jobId: string): Promise<MaterialsResult> {
  const [job, resume, settings] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.resume.findFirst({ orderBy: { uploadedAt: "desc" } }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!job) throw new Error("Job not found");
  if (!resume) throw new Error("Upload your resume in Settings before generating materials.");
  if (!isAnthropicConfigured()) throw new Error("ANTHROPIC_API_KEY is not configured.");

  const result = await generateMaterials({
    jobTitle: job.title,
    company: job.company,
    jobDescription: job.description,
    candidateResume: resume.rawText,
    careerGapNote: settings?.careerGapNote ?? "",
    keyStrengths: settings ? (JSON.parse(settings.keyStrengths) as string[]) : [],
    preferredIndustries: settings ? (JSON.parse(settings.preferredIndustries) as string[]) : [],
  });

  await prisma.job.update({
    where: { id: jobId },
    data: {
      generatedResume: result.resumeImpact,
      generatedResumeAlt: result.resumeSkills,
      generatedCover: result.coverLetter,
      generatedEmail: result.outreachEmail,
      fitAnalysis: result.fitAnalysis,
      status: "resume_generated",
    },
  });

  return result;
}
