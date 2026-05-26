import { PageHeader } from "@/components/PageHeader";
import { DeletedView } from "./DeletedView";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader
        title="Deleted"
        subtitle="Jobs you removed. They won't be re-fetched on future scrapes."
      />
      <div className="px-8 py-6">
        <DeletedView />
      </div>
    </>
  );
}
