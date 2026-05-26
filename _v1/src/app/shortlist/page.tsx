import { PageHeader } from "@/components/PageHeader";
import { ShortlistView } from "./ShortlistView";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Shortlist"
        subtitle="Jobs you want to apply to. Generate tailored resumes & cover letters here."
      />
      <div className="px-8 py-6">
        <ShortlistView />
      </div>
    </>
  );
}
