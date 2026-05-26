"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardSection } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { Empty } from "@/components/ui/Empty";

interface Keyword {
  id: string;
  original: string;
  canonicalTitles: string[];
  createdAt: string;
}

async function fetchKeywords(): Promise<Keyword[]> {
  const r = await fetch("/api/keywords");
  if (!r.ok) throw new Error("Failed to load keywords");
  return r.json();
}

export function KeywordManager() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["keywords"], queryFn: fetchKeywords });
  const [input, setInput] = useState("");

  const addMut = useMutation({
    mutationFn: async (original: string) => {
      const r = await fetch("/api/keywords", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ original }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      setInput("");
      qc.invalidateQueries({ queryKey: ["keywords"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: async (k: { id: string; canonicalTitles: string[] }) => {
      await fetch(`/api/keywords/${k.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ canonicalTitles: k.canonicalTitles }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keywords"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/keywords/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keywords"] }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardSection className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Add a job title keyword (e.g., Business Analyst)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) addMut.mutate(input.trim());
            }}
          />
          <Button
            disabled={!input.trim() || addMut.isPending}
            onClick={() => addMut.mutate(input.trim())}
          >
            {addMut.isPending ? "Expanding…" : "Add keyword"}
          </Button>
        </CardSection>
      </Card>

      {isLoading ? (
        <div className="text-sm text-ink-muted">Loading keywords…</div>
      ) : data.length === 0 ? (
        <Empty
          title="No keywords yet"
          body="Add a job title above to start surfacing matching listings. Claude will expand each one into closely related titles."
        />
      ) : (
        <div className="grid gap-3">
          {data.map((kw) => (
            <KeywordCard
              key={kw.id}
              kw={kw}
              onUpdate={(titles) => updateMut.mutate({ id: kw.id, canonicalTitles: titles })}
              onDelete={() => deleteMut.mutate(kw.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KeywordCard({
  kw,
  onUpdate,
  onDelete,
}: {
  kw: Keyword;
  onUpdate: (titles: string[]) => void;
  onDelete: () => void;
}) {
  const [adding, setAdding] = useState("");
  return (
    <Card>
      <CardSection>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-serif text-lg font-semibold text-ink-primary">{kw.original}</div>
            <div className="text-xs text-ink-muted mt-0.5">{kw.canonicalTitles.length} related titles</div>
          </div>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Remove
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {kw.canonicalTitles.map((t) => (
            <Tag
              key={t}
              tone="blue"
              onRemove={() => onUpdate(kw.canonicalTitles.filter((x) => x !== t))}
            >
              {t}
            </Tag>
          ))}
          <input
            value={adding}
            placeholder="Add a variant…"
            onChange={(e) => setAdding(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && adding.trim()) {
                if (!kw.canonicalTitles.includes(adding.trim())) {
                  onUpdate([...kw.canonicalTitles, adding.trim()]);
                }
                setAdding("");
              }
            }}
            className="text-xs px-2 py-0.5 rounded-full border border-dashed border-line bg-bg-primary focus:outline-none focus:border-line-focus"
          />
        </div>
      </CardSection>
    </Card>
  );
}
