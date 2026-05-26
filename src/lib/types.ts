export type PlatformKey =
  | "greenhouse"
  | "lever"
  | "linkedin"
  | "indeed"
  | "adzuna"
  | "jobbank"
  | "remoteok"
  | "weworkremotely"
  | "remotive"
  | "wellfound"
  | "builtin"
  | "dynamitejobs";

export type Platform = {
  name: string;
  section: "auto" | "search";
  autoApply: boolean;
  fetch: "api" | "jsearch" | "rss" | "playwright";
};

export const PLATFORMS: Record<PlatformKey, Platform> = {
  greenhouse:     { name: "Greenhouse",       section: "auto",   autoApply: true,  fetch: "api" },
  lever:          { name: "Lever",            section: "auto",   autoApply: true,  fetch: "api" },
  linkedin:       { name: "LinkedIn",         section: "search", autoApply: false, fetch: "jsearch" },
  indeed:         { name: "Indeed",           section: "search", autoApply: false, fetch: "jsearch" },
  adzuna:         { name: "Adzuna",           section: "search", autoApply: false, fetch: "api" },
  jobbank:        { name: "Canada Job Bank",  section: "search", autoApply: false, fetch: "api" },
  remoteok:       { name: "RemoteOK",         section: "search", autoApply: false, fetch: "api" },
  weworkremotely: { name: "We Work Remotely", section: "search", autoApply: false, fetch: "rss" },
  remotive:       { name: "Remotive",         section: "search", autoApply: false, fetch: "api" },
  wellfound:      { name: "Wellfound",        section: "search", autoApply: false, fetch: "playwright" },
  builtin:        { name: "Built In Toronto", section: "search", autoApply: false, fetch: "playwright" },
  dynamitejobs:   { name: "Dynamite Jobs",    section: "search", autoApply: false, fetch: "playwright" },
};

export type NormalizedJob = {
  title: string;
  company: string;
  location: string;
  description: string;
  jobType?: string;
  employment?: string;
  salaryMin?: number;
  salaryMax?: number;
  sourceUrl: string;
  source: PlatformKey;
  postedAt?: Date;
  autoApplyEligible: boolean;
};

export type AssetStatus = "pending" | "generating" | "ready" | "failed";
export type ApplyStatus = "applying" | "applied" | "failed" | "opened";
export type Stage = "search" | "shortlist";
export type LogLevel = "info" | "warn" | "error";
export type LogCategory = "fetch" | "score" | "generate" | "apply" | "schedule" | "system";
