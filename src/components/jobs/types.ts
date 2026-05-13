export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  jobType: string | null;
  employment: string | null;
  level: string | null;
  industry: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  sourceUrl: string;
  source: string;
  postedAt: string | null;
  fetchedAt: string;
  score: number | null;
  scoreSummary: string | null;
  scoreDetails: string | null;
  status: string;
  shortlistedAt: string | null;
  appliedAt: string | null;
  generatedResume: string | null;
  generatedCover: string | null;
  fitAnalysis: string | null;
}
