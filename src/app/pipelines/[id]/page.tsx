import { PipelineDetailView } from "./PipelineDetailView";

export const dynamic = "force-dynamic";

export default function PipelineDetailPage({ params }: { params: { id: string } }) {
  return <PipelineDetailView pipelineId={params.id} />;
}
