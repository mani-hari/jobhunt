// Extract a short "what the company does" snippet from a job description.
// Strategy:
//   1. Look for "About <Company>", "About us", "Who we are", "Our mission", "Our company"
//      headings and capture the next sentence or two.
//   2. Fallback: first sentence of the description that doesn't look like a job-duty
//      ("you will...", "responsible for...", "we are looking for...").

const SECTION_PATTERNS: RegExp[] = [
  /\babout (?:us|the company|the team|the role)\b[:\-\s]*([^\n]+)/i,
  /\bwho we are\b[:\-\s]*([^\n]+)/i,
  /\bour mission\b[:\-\s]*([^\n]+)/i,
  /\bour company\b[:\-\s]*([^\n]+)/i,
  /\bcompany overview\b[:\-\s]*([^\n]+)/i,
];

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstNonDutySentence(text: string): string | null {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).slice(0, 6);
  const ignore = /^(you will|you'll|we are looking|we're looking|responsibilities|key responsibilities|the role|what you'll|this role|in this role)/i;
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length < 30) continue;
    if (ignore.test(trimmed)) continue;
    return trimmed.slice(0, 220);
  }
  return null;
}

export function companyBlurb(rawDescription: string, company: string): string | null {
  if (!rawDescription) return null;
  const text = stripHtml(rawDescription);

  // Try "About <Company>"
  const aboutCompany = text.match(new RegExp(`\\babout ${escape(company)}\\b[:\\-\\s]*([^\\n]+)`, "i"));
  if (aboutCompany?.[1]) return clean(aboutCompany[1]);

  for (const re of SECTION_PATTERNS) {
    const m = text.match(re);
    if (m?.[1] && m[1].length > 25) return clean(m[1]);
  }

  return firstNonDutySentence(text);
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clean(s: string): string {
  return s.trim().replace(/\s+/g, " ").slice(0, 220);
}
