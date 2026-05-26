import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { JobDetailView } from "./JobDetailView";
import type { Job } from "@/components/jobs/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) notFound();

  const serializable: Job = {
    ...job,
    postedAt: job.postedAt ? job.postedAt.toISOString() : null,
    fetchedAt: job.fetchedAt.toISOString(),
    shortlistedAt: job.shortlistedAt ? job.shortlistedAt.toISOString() : null,
    appliedAt: job.appliedAt ? job.appliedAt.toISOString() : null,
  };

  return <JobDetailView job={serializable} />;
}
