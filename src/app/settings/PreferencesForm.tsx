"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardSection } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { Toggle } from "@/components/ui/Toggle";

interface Settings {
  preferredLocation: string;
  openToRemote: boolean;
  openToRelocation: string;
  minSalary: number | null;
  preferredIndustries: string[];
  dealBreakers: string | null;
  yearsExperience: number;
  keyStrengths: string[];
  careerGapNote: string;
}

export function PreferencesForm() {
  const qc = useQueryClient();
  const { data } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const r = await fetch("/api/settings");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const saveMut = useMutation({
    mutationFn: async (s: Settings) => {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!r.ok) throw new Error("Save failed");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  if (!form) return <div className="text-sm text-ink-muted">Loading preferences…</div>;

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm({ ...form, [k]: v });

  return (
    <Card>
      <CardSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Preferred location">
            <Input value={form.preferredLocation} onChange={(e) => update("preferredLocation", e.target.value)} />
          </Field>
          <Field label="Open to relocation">
            <Input value={form.openToRelocation} onChange={(e) => update("openToRelocation", e.target.value)} />
          </Field>
          <Field label="Open to remote?">
            <Toggle
              checked={form.openToRemote}
              onChange={(v) => update("openToRemote", v)}
              label={form.openToRemote ? "Yes — happy to work remote" : "No — prefer onsite/hybrid"}
            />
          </Field>
          <Field label="Years of experience">
            <Input
              type="number"
              value={form.yearsExperience}
              onChange={(e) => update("yearsExperience", Number(e.target.value || 0))}
            />
          </Field>
          <Field label="Minimum salary expectation (CAD, optional)">
            <Input
              type="number"
              placeholder="e.g., 95000"
              value={form.minSalary ?? ""}
              onChange={(e) =>
                update("minSalary", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
          <ChipEditor
            label="Preferred industries"
            values={form.preferredIndustries}
            onChange={(v) => update("preferredIndustries", v)}
          />
          <ChipEditor
            label="Key strengths to match"
            values={form.keyStrengths}
            onChange={(v) => update("keyStrengths", v)}
          />
          <Field label="Deal-breakers" hint="e.g., no travel >20%, no US-only roles">
            <Textarea
              value={form.dealBreakers ?? ""}
              onChange={(e) => update("dealBreakers", e.target.value)}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Career gap note" hint="Used in cover letter and scoring context.">
              <Textarea
                value={form.careerGapNote}
                onChange={(e) => update("careerGapNote", e.target.value)}
              />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          {saveMut.isSuccess ? <span className="text-xs text-accent-green">Saved.</span> : null}
          {saveMut.isError ? <span className="text-xs text-accent-red">Save failed.</span> : null}
          <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </CardSection>
    </Card>
  );
}

function ChipEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-bg-card px-3 py-2 min-h-[48px] focus-within:ring-2 focus-within:ring-line-focus">
        {values.map((v) => (
          <Tag key={v} tone="blue" onRemove={() => onChange(values.filter((x) => x !== v))}>
            {v}
          </Tag>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              if (!values.includes(draft.trim())) onChange([...values, draft.trim()]);
              setDraft("");
            }
          }}
          placeholder="Add and press Enter…"
          className="flex-1 min-w-[120px] text-sm bg-transparent focus:outline-none placeholder:text-ink-muted"
        />
      </div>
    </Field>
  );
}
