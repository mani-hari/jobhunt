"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardSection } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { Toggle } from "@/components/ui/Toggle";

interface Board {
  id: string;
  ats: "greenhouse" | "lever" | "ashby";
  slug: string;
  name: string;
  active: boolean;
}

const ATS_INFO: Record<Board["ats"], { label: string; example: string; help: string }> = {
  greenhouse: {
    label: "Greenhouse",
    example: "wealthsimple",
    help: "Find the slug in the company's careers URL: boards.greenhouse.io/<slug>",
  },
  lever: {
    label: "Lever",
    example: "neo",
    help: "From jobs.lever.co/<slug>",
  },
  ashby: {
    label: "Ashby",
    example: "ramp",
    help: "From jobs.ashbyhq.com/<slug>",
  },
};

async function fetchBoards(): Promise<Board[]> {
  const r = await fetch("/api/company-boards");
  if (!r.ok) throw new Error("Failed to load boards");
  return r.json();
}

export function CompanyBoardManager() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["company-boards"], queryFn: fetchBoards });
  const [ats, setAts] = useState<Board["ats"]>("greenhouse");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addMut = useMutation({
    mutationFn: async () => {
      setError(null);
      const r = await fetch("/api/company-boards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ats, slug, name }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Failed");
      return r.json();
    },
    onSuccess: () => {
      setSlug("");
      setName("");
      qc.invalidateQueries({ queryKey: ["company-boards"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await fetch(`/api/company-boards/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-boards"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/company-boards/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-boards"] }),
  });

  const grouped = (["greenhouse", "lever", "ashby"] as const).map((a) => ({
    ats: a,
    info: ATS_INFO[a],
    boards: data.filter((b) => b.ats === a),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardSection>
          <div className="grid grid-cols-1 md:grid-cols-[140px,1fr,1fr,auto] gap-3 items-end">
            <label className="block">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-1.5">ATS</div>
              <select
                value={ats}
                onChange={(e) => setAts(e.target.value as Board["ats"])}
                className="w-full rounded-lg border border-line bg-bg-card px-3 py-3 text-sm focus:outline-none focus:border-line-focus"
              >
                <option value="greenhouse">Greenhouse</option>
                <option value="lever">Lever</option>
                <option value="ashby">Ashby</option>
              </select>
            </label>
            <label className="block">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-1.5">Board slug</div>
              <Input
                placeholder={`e.g. ${ATS_INFO[ats].example}`}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </label>
            <label className="block">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-1.5">Display name (optional)</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Wealthsimple" />
            </label>
            <Button onClick={() => addMut.mutate()} disabled={!slug.trim() || addMut.isPending}>
              {addMut.isPending ? "Adding…" : "Add board"}
            </Button>
          </div>
          <div className="text-xs text-ink-muted mt-2">{ATS_INFO[ats].help}</div>
          {error ? <div className="text-xs text-accent-red mt-1">{error}</div> : null}
        </CardSection>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {grouped.map((g) => (
          <Card key={g.ats}>
            <CardSection>
              <div className="flex items-center justify-between">
                <div className="font-serif text-base font-semibold text-ink-primary">{g.info.label}</div>
                <Tag tone="blue">{g.boards.length}</Tag>
              </div>
              <div className="mt-3 space-y-1.5">
                {g.boards.length === 0 ? (
                  <div className="text-xs text-ink-muted">No boards yet.</div>
                ) : (
                  g.boards.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium text-ink-primary truncate">{b.name}</div>
                        <div className="text-xs text-ink-muted truncate">{b.slug}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Toggle
                          checked={b.active}
                          onChange={(v) => toggleMut.mutate({ id: b.id, active: v })}
                        />
                        <button
                          onClick={() => deleteMut.mutate(b.id)}
                          className="text-xs text-accent-red hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardSection>
          </Card>
        ))}
      </div>
    </div>
  );
}
