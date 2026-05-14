import { scoreColor, scoreLabel } from "@/lib/format";

export function ScoreBar({ score, summary }: { score: number | null; summary?: string | null }) {
  const pct = score ?? 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-secondary">
        <span className="font-medium">{scoreLabel(score)}</span>
        <span>{score == null ? "—" : `${score}/100`}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-line overflow-hidden">
        <div
          className={`h-full ${scoreColor(score)} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {summary ? <p className="mt-2 text-xs text-ink-muted line-clamp-2">{summary}</p> : null}
    </div>
  );
}
