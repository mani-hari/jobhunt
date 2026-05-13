"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type FilterState = {
  range: "24h" | "7d" | "30d" | "7w" | "all";
  type: string[];
  employment: string[];
  level: string[];
  industry: string[];
  source: string[];
  minScore: number | null;
};

export const DEFAULT_FILTERS: FilterState = {
  range: "7d",
  type: [],
  employment: [],
  level: [],
  industry: [],
  source: [],
  minScore: null,
};

const RANGE_LABEL: Record<FilterState["range"], string> = {
  all: "All jobs",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "7w": "Last 7 weeks",
};

const TYPE = ["remote", "onsite", "hybrid"];
const EMPLOYMENT = ["fulltime", "parttime", "contract"];
const LEVEL = ["entry", "mid", "senior", "lead"];
const INDUSTRY = ["Banking", "Fintech", "Insurance", "Tech", "Government", "Other"];
const SOURCE = ["adzuna", "jsearch", "remoteok", "jobbank", "greenhouse", "lever", "ashby", "google"];
const SCORE_OPTS: Array<{ label: string; value: number | null }> = [
  { label: "All scores", value: null },
  { label: "≥40", value: 40 },
  { label: "≥60", value: 60 },
  { label: "≥80", value: 80 },
];

export function SidebarFilters({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const toggleArr = (key: keyof FilterState, v: string) => {
    const arr = value[key] as string[];
    onChange({
      ...value,
      [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
    });
  };

  const hasActive =
    value.range !== "7d" ||
    value.type.length ||
    value.employment.length ||
    value.level.length ||
    value.industry.length ||
    value.source.length ||
    value.minScore != null;

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base font-semibold text-ink-primary">Filters</h2>
        {hasActive ? (
          <button
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
            className="text-xs text-accent-blue hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <Section title="Date posted">
        {(Object.keys(RANGE_LABEL) as FilterState["range"][]).map((r) => (
          <Radio
            key={r}
            label={RANGE_LABEL[r]}
            checked={value.range === r}
            onChange={() => onChange({ ...value, range: r })}
          />
        ))}
      </Section>

      <Section title="Score">
        {SCORE_OPTS.map((opt) => (
          <Radio
            key={opt.label}
            label={opt.label}
            checked={value.minScore === opt.value}
            onChange={() => onChange({ ...value, minScore: opt.value })}
          />
        ))}
      </Section>

      <Section title="Type" defaultOpen>
        {TYPE.map((o) => (
          <Check key={o} label={o} checked={value.type.includes(o)} onChange={() => toggleArr("type", o)} />
        ))}
      </Section>

      <Section title="Employment">
        {EMPLOYMENT.map((o) => (
          <Check key={o} label={o} checked={value.employment.includes(o)} onChange={() => toggleArr("employment", o)} />
        ))}
      </Section>

      <Section title="Level">
        {LEVEL.map((o) => (
          <Check key={o} label={o} checked={value.level.includes(o)} onChange={() => toggleArr("level", o)} />
        ))}
      </Section>

      <Section title="Industry">
        {INDUSTRY.map((o) => (
          <Check key={o} label={o} checked={value.industry.includes(o)} onChange={() => toggleArr("industry", o)} />
        ))}
      </Section>

      <Section title="Source">
        {SOURCE.map((o) => (
          <Check key={o} label={o} checked={value.source.includes(o)} onChange={() => toggleArr("source", o)} />
        ))}
      </Section>
    </aside>
  );
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line pb-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-2"
      >
        <span>{title}</span>
        <span className={cn("text-ink-muted transition", open ? "rotate-180" : "")}>▾</span>
      </button>
      {open ? <div className="space-y-1.5">{children}</div> : null}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-primary cursor-pointer hover:text-accent-blue">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-line accent-accent-blue"
      />
      <span className="capitalize">{label}</span>
    </label>
  );
}

function Radio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-primary cursor-pointer hover:text-accent-blue">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-line accent-accent-blue"
      />
      <span>{label}</span>
    </label>
  );
}

export function filterToQuery(f: FilterState): string {
  const sp = new URLSearchParams();
  sp.set("range", f.range);
  if (f.type.length) sp.set("type", f.type.join(","));
  if (f.employment.length) sp.set("employment", f.employment.join(","));
  if (f.level.length) sp.set("level", f.level.join(","));
  if (f.industry.length) sp.set("industry", f.industry.join(","));
  if (f.source.length) sp.set("source", f.source.join(","));
  if (f.minScore != null) sp.set("minScore", String(f.minScore));
  return sp.toString();
}
