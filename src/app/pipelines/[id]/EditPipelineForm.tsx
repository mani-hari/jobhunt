"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PLATFORMS, PlatformKey } from "@/lib/types";

type Pipeline = {
  id: string;
  name: string;
  keyword: string;
  platforms: string[];
};

type Props = {
  pipeline: Pipeline;
  onCancel: () => void;
  onSaved: () => void;
};

const AUTO_PLATFORMS: PlatformKey[] = ["greenhouse", "lever"];
const SEARCH_PLATFORMS: PlatformKey[] = [
  "linkedin", "indeed", "adzuna", "jobbank",
  "remoteok", "weworkremotely", "remotive",
  "wellfound", "builtin", "dynamitejobs",
];

export function EditPipelineForm({ pipeline, onCancel, onSaved }: Props) {
  const [name, setName] = useState(pipeline.name);
  const [keyword, setKeyword] = useState(pipeline.keyword);
  const [platforms, setPlatforms] = useState<Set<PlatformKey>>(
    new Set(pipeline.platforms as PlatformKey[])
  );
  const [showKeywordWarning, setShowKeywordWarning] = useState(false);
  const [pendingKeyword, setPendingKeyword] = useState("");

  const togglePlatform = (key: PlatformKey) =>
    setPlatforms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const saveMut = useMutation({
    mutationFn: (confirmedKeyword: string) =>
      fetch(`/api/pipelines/${pipeline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          keyword: confirmedKeyword,
          platforms: Array.from(platforms),
        }),
      }).then((r) => r.json()),
    onSuccess: onSaved,
  });

  const handleSave = () => {
    const kw = keyword.trim();
    if (kw !== pipeline.keyword) {
      setPendingKeyword(kw);
      setShowKeywordWarning(true);
    } else {
      saveMut.mutate(kw);
    }
  };

  const inputCls =
    "border border-[var(--border)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]";

  return (
    <div className="space-y-4">
      {showKeywordWarning && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
          <p className="font-medium text-amber-800">Changing keyword clears all jobs. Continue?</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { saveMut.mutate(pendingKeyword); setShowKeywordWarning(false); }}
              className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:opacity-90"
            >
              Yes, clear and continue
            </button>
            <button
              onClick={() => { setShowKeywordWarning(false); setKeyword(pipeline.keyword); }}
              className="px-3 py-1 border border-amber-300 text-amber-700 text-xs rounded hover:bg-amber-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Name</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Keyword</label>
          <input className={inputCls} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      <div>
        <p className="text-xs text-[var(--text-muted)] mb-2">Platforms</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {([...AUTO_PLATFORMS, ...SEARCH_PLATFORMS] as PlatformKey[]).map((key) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={platforms.has(key)}
                onChange={() => togglePlatform(key)}
                className="w-3.5 h-3.5"
              />
              <span className="text-xs text-[var(--text-secondary)]">{PLATFORMS[key].name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saveMut.isPending || !name.trim() || !keyword.trim() || platforms.size === 0}
          className="px-4 py-1.5 text-sm bg-[var(--accent-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {saveMut.isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm text-[var(--text-secondary)] border border-[var(--border)] rounded-md hover:bg-[var(--bg-hover)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
