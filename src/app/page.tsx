import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { JobsView } from "./JobsView";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="Discovered listings across all sources, scored for fit."
      />
      <div className="px-8 py-6">
        <Suspense fallback={<div className="text-sm text-ink-muted">Loading…</div>}>
          <JobsView />
        </Suspense>
      </div>
    </>
  );
}
