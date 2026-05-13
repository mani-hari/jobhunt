import { prisma } from "@/lib/db";
import { geminiJson, isGeminiConfigured } from "@/lib/gemini";
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
  if (!isGeminiConfigured()) return null;

  const settings = await loadSettings();

  const prompt = `You are an expert career advisor. Score how well this job matches the candidate.

CANDIDATE PROFILE:
- Experience: ${settings.yearsExperience} years in ${settings.preferredIndustries.join(", ")}
- Key skills: ${settings.keyStrengths.join(", ")}
- Location preference: ${settings.preferredLocation}, Remote: ${settings.openToRemote ? "yes" : "no"}
- Deal-breakers: ${settings.dealBreakers ?? "none"}
- Career context: ${settings.careerGapNote}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Type: ${job.jobType ?? "unspecified"}
Employment: ${job.employment ?? "unspecified"}
Description: ${job.description.slice(0, 6000)}

Score this job from 0-100 on practical fit. Be REALISTIC, not aspirational.
Consider:
- Skills match (40% weight)
- Location/remote compatibility (20% weight)
- Industry/domain relevance (20% weight)
- Seniority fit (10% weight)
- Career gap friendliness — does posting mention "returners" or flexible requirements? (10% weight)

Return JSON only:
{
  "score": 72,
  "summary": "One sentence on why this score",
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1"],
  "tip": "One actionable tip for applying"
}`;

  const result = await geminiJson<ScoreDetails>(prompt);

  await prisma.job.update({
    where: { id },
    data: {
      score: Math.max(0, Math.min(100, Math.round(result.score))),
      scoreSummary: result.summary,
      scoreDetails: JSON.stringify(result),
    },
  });

  return result;
}
