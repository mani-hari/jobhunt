"use client";

import { Button } from "@/components/ui/Button";
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
const SOURCE = ["adzuna", "jsearch", "remoteok", "jobbank"];
const SCORE_OPTS: Array<{ label: string; value: number | null }> = [
  { label: "All", value: null },
  { label: "≥40", value: 40 },
  { label: "≥60", value: 60 },
  { label: "≥80", value: 80 },
];

export function Filters({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const toggle = (key: keyof FilterState, v: string) => {
    const arr = value[key] as string[];
    onChange({
      ...value,
      [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v],
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 border-b border-line pb-3">
        {(Object.keys(RANGE_LABEL) as FilterState["range"][]).map((r) => (
          <button
            key={r}
            onClick={() => onChange({ ...value, range: r })}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition",
              value.range === r
                ? "bg-bg-selected text-accent-blue"
                : "text-ink-secondary hover:bg-bg-hover"
            )}
          >
            {RANGE_LABEL[r]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Group label="Type" options={TYPE} selected={value.type} onToggle={(v) => toggle("type", v)} />
        <Group label="Employment" options={EMPLOYMENT} selected={value.employment} onToggle={(v) => toggle("employment", v)} />
        <Group label="Level" options={LEVEL} selected={value.level} onToggle={(v) => toggle("level", v)} />
        <Group label="Industry" options={INDUSTRY} selected={value.industry} onToggle={(v) => toggle("industry", v)} />
        <Group label="Source" options={SOURCE} selected={value.source} onToggle={(v) => toggle("source", v)} />

        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted mr-1">Score</span>
          {SCORE_OPTS.map((o) => (
            <Chip
              key={o.label}
              active={value.minScore === o.value}
              onClick={() => onChange({ ...value, minScore: o.value })}
            >
              {o.label}
            </Chip>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_FILTERS })}>
          Clear all filters
        </Button>
      </div>
    </div>
  );
}

function Group({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted mr-1">{label}</span>
      {options.map((o) => (
        <Chip key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium border transition",
        active
          ? "bg-accent-blue text-white border-accent-blue"
          : "bg-bg-card text-ink-secondary border-line hover:bg-bg-hover"
      )}
    >
      {children}
    </button>
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
