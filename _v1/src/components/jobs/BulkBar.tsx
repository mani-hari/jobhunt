"use client";

import type { ReactNode } from "react";

export function BulkBar({
  count,
  children,
  onClear,
}: {
  count: number;
  children: ReactNode;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-line bg-bg-card/90 backdrop-blur shadow-card-hover">
        <span className="text-sm font-medium text-ink-primary">
          {count} job{count === 1 ? "" : "s"} selected
        </span>
        <span className="text-line">|</span>
        {children}
        <button onClick={onClear} className="text-sm text-ink-secondary hover:text-ink-primary">
          Clear
        </button>
      </div>
    </div>
  );
}
