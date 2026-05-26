export default function PipelinesPage() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          No pipeline selected
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Select a pipeline from the left, or create one with &ldquo;+ Add Pipeline&rdquo;.
        </p>
      </div>
    </div>
  );
}
