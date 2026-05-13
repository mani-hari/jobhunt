import { PageHeader } from "@/components/PageHeader";
import { ApplicationsView } from "./ApplicationsView";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Roles where materials are ready or you've started applying."
      />
      <div className="px-8 py-6">
        <ApplicationsView />
      </div>
    </>
  );
}
