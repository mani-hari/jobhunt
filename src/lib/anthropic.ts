import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";

const SCORING_MODEL = process.env.ANTHROPIC_SCORING_MODEL ?? "claude-haiku-4-5";
const GENERATION_MODEL = process.env.ANTHROPIC_GENERATION_MODEL ?? "claude-opus-4-7";

let cachedClient: Anthropic | null = null;
function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

export const isAnthropicConfigured = () => !!process.env.ANTHROPIC_API_KEY;

// -----------------------------------------------------------------------------
// Persona loader — soul.md + archana.md are read once per process and reused
// as a stable, cache-friendly system prompt prefix.
// -----------------------------------------------------------------------------

let cachedPersona: string | null = null;
async function loadPersona(): Promise<string> {
  if (cachedPersona) return cachedPersona;
  const docsDir = join(process.cwd(), "docs");
  const [soul, archana] = await Promise.all([
    readFile(join(docsDir, "soul.md"), "utf8").catch(() => ""),
    readFile(join(docsDir, "archana.md"), "utf8").catch(() => ""),
  ]);
  cachedPersona = [
    "You are operating as the AI consultant inside the ARCS Job Hunter app.",
    "Below are two reference documents that define (a) your persona and (b) the candidate you're advising.",
    "Treat both as authoritative. Follow soul.md when writing anything user-facing.",
    "",
    "---",
    "# soul.md — Your persona",
    "",
    soul,
    "",
    "---",
    "# archana.md — The candidate",
    "",
    archana,
  ].join("\n");
  return cachedPersona;
}

function systemBlocks(extra?: string): Anthropic.TextBlockParam[] {
  // The persona is a stable, ~3-5K-token prefix that benefits massively from
  // prompt caching. The `extra` block (per-task framing) comes after, so the
  // cache prefix stays identical across all calls.
  const blocks: Anthropic.TextBlockParam[] = [];
  // Note: persona is added lazily in each call (because loadPersona is async).
  // We construct the blocks array inside the call helpers below.
  if (extra) blocks.push({ type: "text", text: extra });
  return blocks;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function firstTextBlock(content: Anthropic.ContentBlock[]): string {
  const block = content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return block ? block.text : "";
}

function extractJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.search(/[\[{]/);
  const candidate = start >= 0 ? cleaned.slice(start) : cleaned;
  return JSON.parse(candidate) as T;
}

// -----------------------------------------------------------------------------
// Scoring — Haiku 4.5, structured JSON output, cached persona prefix
// -----------------------------------------------------------------------------

export interface JobScoreResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  tip: string;
}

const SCORE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
    tip: { type: "string" },
  },
  required: ["score", "summary", "strengths", "gaps", "tip"],
  additionalProperties: false,
} as const;

export async function scoreJob(args: {
  title: string;
  company: string;
  location: string;
  jobType?: string | null;
  employment?: string | null;
  description: string;
  preferredLocation: string;
  openToRemote: boolean;
  yearsExperience: number;
  preferredIndustries: string[];
  keyStrengths: string[];
  careerGapNote: string;
  dealBreakers?: string | null;
}): Promise<JobScoreResult> {
  const persona = await loadPersona();

  const userPrompt = `Score this job for the candidate. Be realistic — use the weights in soul.md.

CANDIDATE LIVE PROFILE (today, may differ from archana.md):
- Years of experience: ${args.yearsExperience}
- Key strengths: ${args.keyStrengths.join(", ")}
- Preferred location: ${args.preferredLocation}; open to remote: ${args.openToRemote ? "yes" : "no"}
- Preferred industries: ${args.preferredIndustries.join(", ")}
- Deal-breakers: ${args.dealBreakers || "none stated"}
- Career context: ${args.careerGapNote}

JOB POSTING:
Title: ${args.title}
Company: ${args.company}
Location: ${args.location}
Type: ${args.jobType ?? "unspecified"}
Employment: ${args.employment ?? "unspecified"}
Description: ${args.description.slice(0, 6000)}

Return JSON only.`;

  const response = await client().messages.create({
    model: SCORING_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: persona,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: SCORE_SCHEMA,
      },
    },
    messages: [{ role: "user", content: userPrompt }],
  } as Anthropic.MessageCreateParamsNonStreaming);

  const raw = firstTextBlock(response.content);
  const result = extractJson<JobScoreResult>(raw);
  result.score = Math.max(0, Math.min(100, Math.round(result.score)));
  return result;
}

// -----------------------------------------------------------------------------
// Keyword expansion — Haiku 4.5
// -----------------------------------------------------------------------------

const KEYWORD_SCHEMA = {
  type: "object",
  properties: {
    titles: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8,
    },
  },
  required: ["titles"],
  additionalProperties: false,
} as const;

export async function expandKeyword(keyword: string): Promise<string[]> {
  if (!isAnthropicConfigured()) return [keyword];
  const persona = await loadPersona();

  const userPrompt = `Given the job title keyword: "${keyword}"

Return 4-8 closely related job titles that would appear in real job postings
in the Canadian market. Stay narrow and practical — only titles a recruiter
would consider equivalent or very close.

Do NOT include:
- Senior/Junior/Lead variants (handled separately)
- Titles from completely different career tracks
- Generic titles like "Analyst" alone

Example: "Business Analyst" → ["Business Systems Analyst", "Business Data Analyst", "Business Intelligence Analyst", "BA - Business Analysis", "Business Process Analyst"]

Return JSON with a single key "titles".`;

  try {
    const response = await client().messages.create({
      model: SCORING_MODEL,
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: persona,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: KEYWORD_SCHEMA,
        },
      },
      messages: [{ role: "user", content: userPrompt }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const raw = firstTextBlock(response.content);
    const parsed = extractJson<{ titles: string[] }>(raw);
    return Array.isArray(parsed.titles) && parsed.titles.length ? parsed.titles.slice(0, 8) : [keyword];
  } catch (err) {
    console.error("[anthropic] expandKeyword failed", err);
    return [keyword];
  }
}

// -----------------------------------------------------------------------------
// v2 Pipeline job assets — single Opus call returns resume + cover + fit summary
// -----------------------------------------------------------------------------

export interface JobAssetsResult {
  resume: string;       // ATS-formatted Markdown (single-column, Calibri rules)
  coverLetter: string;  // Markdown, 3 paragraphs
  fitSummary: string;   // 2 sentences: match count + tip
}

const JOB_ASSETS_SCHEMA = {
  type: "object",
  properties: {
    resume: {
      type: "string",
      description: "ATS-optimised resume in clean Markdown. Single-column. Sections: Professional Summary, Technical Skills, Professional Experience, Education & Certifications. 2 pages max. Mirror JD keywords naturally. Address career break once in the summary.",
    },
    cover_letter: {
      type: "string",
      description: "Cover letter in Markdown. 3 short paragraphs, under 250 words. P1: why this role + company. P2: 2 concrete achievements matching JD. P3: career-gap sentence (if relevant) + availability. No clichés.",
    },
    fit_summary: {
      type: "string",
      description: "Exactly 2 sentences. Sentence 1: how many key requirements match and which ones. Sentence 2: any gap and a specific apply tip. Be honest and practical.",
    },
  },
  required: ["resume", "cover_letter", "fit_summary"],
  additionalProperties: false,
} as const;

export async function generateJobAssets(args: {
  jobTitle: string;
  company: string;
  jobDescription: string;
  candidateResume: string;
  careerGapNote: string;
  keyStrengths: string[];
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedInUrl?: string | null;
}): Promise<JobAssetsResult> {
  const persona = await loadPersona();

  const contactLine = [
    args.firstName && args.lastName ? `${args.firstName} ${args.lastName}` : null,
    args.email,
    args.phone,
    args.linkedInUrl,
  ]
    .filter(Boolean)
    .join(" | ");

  const userPrompt = `Generate ATS-optimised application materials for Archana for this role. Follow soul.md precisely.

TARGET JOB:
Title: ${args.jobTitle}
Company: ${args.company}
Description:
${args.jobDescription.slice(0, 8000)}

CANDIDATE'S RESUME (source of truth — every claim must come from here):
${args.candidateResume}

CONTACT INFO FOR RESUME HEADER: ${contactLine || "use what's in the resume"}
CAREER CONTEXT: ${args.careerGapNote}
KEY STRENGTHS: ${args.keyStrengths.join(", ")}

ATS FORMATTING RULES FOR RESUME (non-negotiable):
1. Single-column layout — no sidebars, no two-column grids.
2. Section order: Professional Summary → Technical Skills → Professional Experience → Education & Certifications.
3. Professional Summary: 3-4 lines, mentions the target role title and "${args.company}" by name.
4. Quantify achievements using numbers from the actual resume.
5. Mirror JD keywords naturally — never stuff.
6. No fabrication — every fact from the candidate's resume.
7. Career gap: one brief professional note in the Professional Summary ("Returning after ~1.4-year personal/family chapter, fully re-engaged").
8. 2 pages maximum.
9. Use H2 for section headings, bullet lists for experience bullets, bold for company/title lines.
10. Contact info at the top: Name | Email | Phone | Location | LinkedIn.

COVER LETTER RULES:
- 3 paragraphs, under 250 words.
- P1: why THIS company and THIS role (specific hook from the JD).
- P2: 2 concrete achievements matching their stated needs.
- P3: career-gap sentence + availability + warm close (never "I look forward to hearing from you").
- Never start with "I am writing to apply for".

Return JSON only.`;

  const response = await client().messages.create({
    model: GENERATION_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: {
        type: "json_schema",
        schema: JOB_ASSETS_SCHEMA,
      },
    },
    system: [
      {
        type: "text",
        text: persona,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  } as Anthropic.MessageCreateParamsNonStreaming);

  const raw = firstTextBlock(response.content);
  const parsed = extractJson<{ resume: string; cover_letter: string; fit_summary: string }>(raw);

  return {
    resume: parsed.resume,
    coverLetter: parsed.cover_letter,
    fitSummary: parsed.fit_summary,
  };
}

// -----------------------------------------------------------------------------
// Resume / cover letter / outreach email / fit — single Opus 4.7 call returns all 4
// -----------------------------------------------------------------------------

export interface GenerationResult {
  resumeImpact: string;
  resumeSkills: string;
  coverLetter: string;
  outreachEmail: string;
  fitAnalysis: string;
}

const GENERATION_SCHEMA = {
  type: "object",
  properties: {
    resume_impact_led: {
      type: "string",
      description: "Tailored resume in clean Markdown — IMPACT-LED variant. Lead each bullet with the outcome (numbers, named systems, scope). 2 pages max. Sections: Professional Summary, Technical Skills, Professional Experience, Education & Certifications.",
    },
    resume_skills_led: {
      type: "string",
      description: "Tailored resume in clean Markdown — SKILLS-LED variant. Lead with the technical/domain match against this JD. Same facts, different framing. 2 pages max. Same section order.",
    },
    cover_letter: {
      type: "string",
      description: "Cover letter in clean Markdown. 3 short paragraphs, under 250 words, no clichés.",
    },
    outreach_email: {
      type: "string",
      description: "Outreach email in clean Markdown. Start with a subject line on the first line. 3 short paragraphs, under 130 words.",
    },
    fit_analysis: {
      type: "string",
      description: "3-4 sentence honest analysis: why this job is or isn't a great fit. Name specific matching skills and any stretch areas.",
    },
  },
  required: [
    "resume_impact_led",
    "resume_skills_led",
    "cover_letter",
    "outreach_email",
    "fit_analysis",
  ],
  additionalProperties: false,
} as const;

export async function generateMaterials(args: {
  jobTitle: string;
  company: string;
  jobDescription: string;
  candidateResume: string;
  careerGapNote: string;
  keyStrengths: string[];
  preferredIndustries: string[];
}): Promise<GenerationResult> {
  const persona = await loadPersona();

  const userPrompt = `Generate tailored application materials for Archana for this role. Follow soul.md for tone, structure, and rules.

TARGET JOB:
Title: ${args.jobTitle}
Company: ${args.company}
Description:
${args.jobDescription}

CANDIDATE'S CURRENT RESUME (source of truth — every claim must come from here):
${args.candidateResume}

LIVE CONTEXT:
- Key strengths: ${args.keyStrengths.join(", ")}
- Preferred industries: ${args.preferredIndustries.join(", ")}
- Career context: ${args.careerGapNote}

DELIVERABLES (return as the JSON schema):
1. resume_impact_led — Markdown resume, impact-led variant
2. resume_skills_led — Markdown resume, skills-led variant (same facts, different framing)
3. cover_letter — Markdown
4. outreach_email — Markdown, starts with "Subject: ..."
5. fit_analysis — 3-4 sentences

NON-NEGOTIABLES:
- Every fact must trace back to the candidate's resume. No fabrications.
- Mirror the JD's keywords naturally — never stuff.
- Address the career break in ONE place per artifact (typically the summary line in the resume, paragraph 3 in the cover letter, never apologetic).
- No clichés, no emoji, no exclamation marks.
- Use "Led / designed / owned / delivered / reduced / consolidated" verbs.`;

  const response = await client().messages.create({
    model: GENERATION_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: {
        type: "json_schema",
        schema: GENERATION_SCHEMA,
      },
    },
    system: [
      {
        type: "text",
        text: persona,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  } as Anthropic.MessageCreateParamsNonStreaming);

  const raw = firstTextBlock(response.content);
  const parsed = extractJson<{
    resume_impact_led: string;
    resume_skills_led: string;
    cover_letter: string;
    outreach_email: string;
    fit_analysis: string;
  }>(raw);

  return {
    resumeImpact: parsed.resume_impact_led,
    resumeSkills: parsed.resume_skills_led,
    coverLetter: parsed.cover_letter,
    outreachEmail: parsed.outreach_email,
    fitAnalysis: parsed.fit_analysis,
  };
}
