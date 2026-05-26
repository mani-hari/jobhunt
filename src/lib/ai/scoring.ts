import { db } from "@/lib/db";
import { isAnthropicConfigured, scoreJob, JobScoreResult } from "@/lib/anthropic";

async function loadSettings() {
  const s = await db.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return {
    preferredLocation: s.preferredLocation,
    openToRemote: s.openToRemote,
    yearsExperience: s.yearsExperience,
    preferredIndustries: JSON.parse(s.preferredIndustries) as string[],
    keyStrengths: JSON.parse(s.keyStrengths) as string[],
    careerGapNote: s.careerGapNote,
    dealBreakers: s.dealBreakers,
  };
}

export async function scoreJobById(id: string): Promise<JobScoreResult | null> {
  const job = await db.job.findUnique({ where: { id } });
  if (!job) return null;
  if (!isAnthropicConfigured()) return null;

  const settings = await loadSettings();
  const result = await scoreJob({
    title: job.title,
    company: job.company,
    location: job.location,
    jobType: job.jobType,
    employment: job.employment,
    description: job.description,
    ...settings,
  });

  await db.job.update({
    where: { id },
    data: { score: result.score, scoreSummary: result.summary },
  });

  return result;
}

export async function scoreUnscoredJobs(
  pipelineId?: string,
  limit = 50
): Promise<{ scored: number; failed: number }> {
  if (!isAnthropicConfigured()) return { scored: 0, failed: 0 };

  const settings = await loadSettings();

  const candidates = await db.pipelineJob.findMany({
    where: {
      ...(pipelineId ? { pipelineId } : {}),
      job: { score: null },
    },
    include: { job: true },
    take: limit,
  });

  let scored = 0;
  let failed = 0;
  for (const pj of candidates) {
    try {
      const result = await scoreJob({
        title: pj.job.title,
        company: pj.job.company,
        location: pj.job.location,
        jobType: pj.job.jobType,
        employment: pj.job.employment,
        description: pj.job.description,
        ...settings,
      });
      await db.job.update({
        where: { id: pj.job.id },
        data: { score: result.score, scoreSummary: result.summary },
      });
      scored++;
    } catch {
      failed++;
    }
  }

  return { scored, failed };
}
