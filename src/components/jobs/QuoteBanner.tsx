"use client";

import { useMemo, useState } from "react";
import { QUOTES, quoteOfTheDay } from "@/lib/quotes";

export function QuoteBanner() {
  const initial = useMemo(() => quoteOfTheDay(), []);
  const [idx, setIdx] = useState(() => QUOTES.indexOf(initial));

  const quote = QUOTES[idx];

  return (
    <div className="rounded-2xl bg-gradient-to-r from-accent-blue-light/70 via-bg-card to-accent-blue-light/40 border border-line p-5 flex items-start gap-4">
      <div className="text-4xl text-accent-blue/60 font-serif leading-none select-none">&ldquo;</div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-lg italic text-ink-primary leading-snug">{quote.text}</p>
        {quote.author ? (
          <div className="text-xs uppercase tracking-[0.18em] text-ink-muted mt-2">— {quote.author}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setIdx((idx + 1) % QUOTES.length)}
        title="Another quote"
        className="shrink-0 text-xs text-ink-secondary hover:text-accent-blue px-2 py-1 rounded-md hover:bg-bg-hover transition"
      >
        Another ↻
      </button>
    </div>
  );
}
