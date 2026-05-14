import { prisma } from "@/lib/db";
import { geminiText, isGeminiConfigured } from "@/lib/gemini";

interface GenerationResult {
  resume: string;
  coverLetter: string;
  outreachEmail: string;
  fitAnalysis: string;
}

export async function generateApplicationMaterials(jobId: string): Promise<GenerationResult> {
  const [job, resume, settings] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.resume.findFirst({ orderBy: { uploadedAt: "desc" } }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!job) throw new Error("Job not found");
  if (!resume) throw new Error("Upload your resume in Settings before generating materials.");
  if (!isGeminiConfigured()) throw new Error("GEMINI_API_KEY is not configured.");

  const careerGap = settings?.careerGapNote ?? "";

  const resumePrompt = `You are an expert resume writer specializing in the Canadian job market.
TASK: Rewrite this candidate's resume to be optimally tailored for the specific job below.

CANDIDATE'S CURRENT RESUME:
${resume.rawText}

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

INSTRUCTIONS:
1. Keep all facts truthful — do not fabricate experience or skills
2. Reorder and emphasize bullet points that match the job's requirements
3. Mirror keywords from the job description naturally (not stuffing)
4. Quantify achievements wherever the original resume allows
5. Add a tailored Professional Summary (3-4 lines) at the top
6. If the candidate has a career gap, include a brief professional note: "${careerGap}"
7. Keep to 2 pages maximum
8. Format sections: Professional Summary, Technical Skills, Professional Experience, Education & Certifications

Return the resume as clean Markdown.`;

  const coverPrompt = `Write a compelling cover letter for this job application.

CANDIDATE PROFILE:
${resume.rawText}

JOB:
Title: ${job.title} at ${job.company}
Description: ${job.description}

STYLE:
- Professional but warm
- 3-4 paragraphs
- First paragraph: why this role + company specifically
- Middle: 2-3 concrete achievements that match their needs
- Close: enthusiasm + availability
- Address career gap naturally if relevant: "${careerGap}"
- Do NOT be generic — reference specific details from the job posting

Return as clean Markdown.`;

  const fitPrompt = `Based on the resume and job description below, write a 3-4 sentence analysis of why
this job is or isn't a good fit. Be honest about gaps. Mention specific matching
skills and any stretch areas.

RESUME:
${resume.rawText.slice(0, 4000)}

JOB:
Title: ${job.title} at ${job.company}
Description: ${job.description.slice(0, 3000)}`;

  const emailPrompt = `Write a short outreach email to a recruiter or hiring manager at ${job.company}
about the ${job.title} role.

CANDIDATE:
${resume.rawText.slice(0, 3500)}

JOB:
Title: ${job.title} at ${job.company}
Description: ${job.description.slice(0, 2500)}

STYLE:
- Warm, confident, concise — under 150 words.
- Include a subject line on the first line in this format: "Subject: ..."
- Then 3 short paragraphs: (1) why you're reaching out about this specific role,
  (2) one or two concrete matching strengths, (3) an ask — a quick chat or
  feedback on your application.
- Address career gap naturally if relevant: "${careerGap}"
- Sign off with "Warm regards," followed by the candidate's name from the resume.

Return as clean Markdown.`;

  const [resumeMd, coverMd, fitText, emailMd] = await Promise.all([
    geminiText(resumePrompt, undefined, 4096),
    geminiText(coverPrompt, undefined, 2048),
    geminiText(fitPrompt, undefined, 512),
    geminiText(emailPrompt, undefined, 1024),
  ]);

  await prisma.job.update({
    where: { id: jobId },
    data: {
      generatedResume: resumeMd,
      generatedCover: coverMd,
      generatedEmail: emailMd,
      fitAnalysis: fitText,
      status: "resume_generated",
    },
  });

  return { resume: resumeMd, coverLetter: coverMd, outreachEmail: emailMd, fitAnalysis: fitText };
}
