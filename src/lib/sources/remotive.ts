import { NormalizedJob } from "@/lib/types";

type RemotiveJob = {
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  description: string;
  job_type: string;
  publication_date: string;
};

export async function fetchRemotive(keyword: string, limit: number): Promise<NormalizedJob[]> {
  try {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=${limit}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json() as { jobs: RemotiveJob[] };
    return (data.jobs ?? []).slice(0, limit).map((job) => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || "Remote",
      description: job.description,
      jobType: "remote",
      employment: job.job_type?.toLowerCase().includes("contract") ? "contract" : "fulltime",
      sourceUrl: job.url,
      source: "remotive" as const,
      postedAt: job.publication_date ? new Date(job.publication_date) : undefined,
      autoApplyEligible: false,
    }));
  } catch {
    return [];
  }
}
