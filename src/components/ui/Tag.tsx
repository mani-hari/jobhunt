import { cn } from "@/lib/cn";

type Tone = "neutral" | "blue" | "green" | "amber" | "red";

const TONE: Record<Tone, string> = {
  neutral: "bg-bg-hover text-ink-secondary",
  blue: "bg-accent-blue-light text-accent-blue",
  green: "bg-green-50 text-accent-green",
  amber: "bg-amber-50 text-accent-amber",
  red: "bg-red-50 text-accent-red",
};

export function Tag({
  children,
  tone = "neutral",
  className,
  onRemove,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE[tone],
        className
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 text-current/70 hover:text-current"
          aria-label="Remove"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
