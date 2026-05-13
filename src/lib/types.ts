export type JobStatus =
  | "discovered"
  | "shortlisted"
  | "resume_generated"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "hold"
  | "deleted";

export type JobType = "remote" | "onsite" | "hybrid";
export type Employment = "fulltime" | "parttime" | "contract";
export type Level = "entry" | "mid" | "senior" | "lead";

export interface ScoreDetails {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  tip: string;
}

export interface NormalizedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  jobType?: string | null;
  employment?: string | null;
  level?: string | null;
  industry?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  sourceUrl: string;
  source: string;
  postedAt?: Date | null;
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  discovered: "Discovered",
  shortlisted: "Shortlisted",
  resume_generated: "Resume Generated",
  applied: "Applied",
  interview: "Interview Scheduled",
  offer: "Offer",
  rejected: "Rejected",
  hold: "On Hold",
  deleted: "Deleted",
};
