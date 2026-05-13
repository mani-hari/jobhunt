"use client";

import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 select-none",
      )}
    >
      <span
        className={cn(
          "relative inline-block h-5 w-9 rounded-full transition",
          checked ? "bg-accent-blue" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition",
            checked && "translate-x-4"
          )}
        />
      </span>
      {label ? <span className="text-sm text-ink-primary">{label}</span> : null}
    </button>
  );
}
