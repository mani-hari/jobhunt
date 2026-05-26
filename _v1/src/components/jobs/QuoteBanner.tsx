"use client";

import { useMemo, useState } from "react";
import { QUOTES, quoteOfTheDay } from "@/lib/quotes";

export function QuoteBanner() {
  const initial = useMemo(() => quoteOfTheDay(), []);
  const [idx, setIdx] = useState(() => QUOTES.indexOf(initial));
  const quote = QUOTES[idx];

  return (
    <div className="rounded-xl bg-gradient-to-r from-accent-blue-light/70 via-bg-card to-accent-blue-light/40 border border-line px-4 py-2.5 flex items-center gap-3">
      <span className="font-serif text-2xl text-accent-blue/60 leading-none select-none shrink-0">&ldquo;</span>
      <p className="flex-1 min-w-0 text-sm font-serif italic text-ink-primary truncate">
        {quote.text}
        {quote.author ? (
          <span className="not-italic text-ink-muted ml-2 font-sans text-xs tracking-wide">
            — {quote.author}
          </span>
        ) : null}
      </p>
      <button
        type="button"
        onClick={() => setIdx((idx + 1) % QUOTES.length)}
        title="Another quote"
        className="shrink-0 text-xs text-ink-secondary hover:text-accent-blue px-2 py-1 rounded-md hover:bg-bg-hover transition"
      >
        ↻
      </button>
    </div>
  );
}
