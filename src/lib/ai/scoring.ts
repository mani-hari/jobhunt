import { prisma } from "@/lib/db";
import { isAnthropicConfigured, scoreJob } from "@/lib/anthropic";
import type { ScoreDetails } from "@/lib/types";

interface SettingsLike {
  preferredLocation: string;
  openToRemote: boolean;
  yearsExperience: number;
  preferredIndustries: string[];
  keyStrengths: string[];
  careerGapNote: string;
  dealBreakers: string | null;
}

async function loadSettings(): Promise<SettingsLike> {
  const s = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return {
    preferredLocation: s.preferredLocation,
    openToRemote: s.openToRemote,
    yearsExperience: s.yearsExperience,
    preferredIndustries: JSON.parse(s.preferredIndustries),
    keyStrengths: JSON.parse(s.keyStrengths),
    careerGapNote: s.careerGapNote,
    dealBreakers: s.dealBreakers,
  };
}

export async function scoreJobById(id: string): Promise<ScoreDetails | null> {
  const job = await prisma.job.findUnique({ where: { id } });
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

  await prisma.job.update({
    where: { id },
    data: {
      score: result.score,
      scoreSummary: result.summary,
      scoreDetails: JSON.stringify(result),
    },
  });

  return result;
}

export async function scoreUnscoredJobs(limit = 50): Promise<{ scored: number; failed: number; remaining: number }> {
  if (!isAnthropicConfigured()) return { scored: 0, failed: 0, remaining: 0 };

  const settings = await loadSettings();
  const candidates = await prisma.job.findMany({
    where: { score: null, status: { not: "deleted" } },
    orderBy: [{ postedAt: "desc" }, { fetchedAt: "desc" }],
    take: limit,
  });

  let scored = 0;
  let failed = 0;
  for (const job of candidates) {
    try {
      const result = await scoreJob({
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.jobType,
        employment: job.employment,
        description: job.description,
        ...settings,
      });
      await prisma.job.update({
        where: { id: job.id },
        data: {
          score: result.score,
          scoreSummary: result.summary,
          scoreDetails: JSON.stringify(result),
        },
      });
      scored++;
    } catch (err) {
      console.error(`[auto-score] job ${job.id} failed`, err);
      failed++;
    }
  }

  const remaining = await prisma.job.count({
    where: { score: null, status: { not: "deleted" } },
  });

  return { scored, failed, remaining };
}
