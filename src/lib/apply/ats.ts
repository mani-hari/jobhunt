// Greenhouse and Lever application submission via their Job Board APIs.
// These are public-facing APIs that accept application submissions without
// company-side API keys — they're the same APIs that power their hosted
// "Apply" forms.

type Job = {
  title: string;
  company: string;
  sourceUrl: string;
  source: string;
};

type Settings = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedInUrl?: string | null;
} | null;

type ApplyResult = { success: boolean; error?: string };

// Extract Greenhouse board token and job ID from the job URL.
// URL format: https://boards.greenhouse.io/<board>/jobs/<jobId>
function parseGreenhouseUrl(url: string): { board: string; jobId: string } | null {
  const m = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (!m) return null;
  return { board: m[1], jobId: m[2] };
}

// Extract Lever company slug and job ID from the job URL.
// URL format: https://jobs.lever.co/<company>/<jobId>
function parseLeverUrl(url: string): { company: string; jobId: string } | null {
  const m = url.match(/lever\.co\/([^/]+)\/([a-f0-9-]+)/);
  if (!m) return null;
  return { company: m[1], jobId: m[2] };
}

export async function applyViaGreenhouseAPI(job: Job, settings: Settings): Promise<ApplyResult> {
  const parsed = parseGreenhouseUrl(job.sourceUrl);
  if (!parsed) {
    return { success: false, error: "Could not parse Greenhouse board/job from URL" };
  }

  if (!settings?.email || !settings?.firstName || !settings?.lastName) {
    return { success: false, error: "Personal info incomplete — fill in Settings first (name + email required)" };
  }

  // Greenhouse Job Board API: POST /v1/boards/{board_token}/jobs/{job_id}
  // Docs: https://developers.greenhouse.io/job-board.html#apply-for-a-job
  const url = `https://boards-api.greenhouse.io/v1/boards/${parsed.board}/jobs/${parsed.jobId}`;

  const body = new FormData();
  body.append("first_name", settings.firstName);
  body.append("last_name", settings.lastName);
  body.append("email", settings.email);
  if (settings.phone) body.append("phone", settings.phone);
  if (settings.linkedInUrl) {
    body.append("website_addresses[][url]", settings.linkedInUrl);
    body.append("website_addresses[][website_type]", "linkedin");
  }
  body.append("mapped_url", job.sourceUrl);

  try {
    const res = await fetch(url, { method: "POST", body });
    if (res.ok || res.status === 201) {
      return { success: true };
    }
    const errText = await res.text().catch(() => res.statusText);
    return { success: false, error: `Greenhouse API ${res.status}: ${errText.slice(0, 300)}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function applyViaLeverAPI(job: Job, settings: Settings): Promise<ApplyResult> {
  const parsed = parseLeverUrl(job.sourceUrl);
  if (!parsed) {
    return { success: false, error: "Could not parse Lever company/job from URL" };
  }

  if (!settings?.email || !settings?.firstName || !settings?.lastName) {
    return { success: false, error: "Personal info incomplete — fill in Settings first (name + email required)" };
  }

  // Lever Postings API: POST /v0/postings/{company}/{jobId}/apply
  const url = `https://api.lever.co/v0/postings/${parsed.company}/${parsed.jobId}/apply`;

  const payload = {
    name: `${settings.firstName} ${settings.lastName}`,
    email: settings.email,
    phone: settings.phone ?? undefined,
    urls: settings.linkedInUrl
      ? { LinkedIn: settings.linkedInUrl }
      : undefined,
    comments: `Applying via Archana Job Hunter — ATS-optimised resume included.`,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status === 201) {
      return { success: true };
    }
    const errText = await res.text().catch(() => res.statusText);
    return { success: false, error: `Lever API ${res.status}: ${errText.slice(0, 300)}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
