"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PLATFORMS, PlatformKey } from "@/lib/types";

type Props = { open: boolean; onClose: () => void };

const AUTO_PLATFORMS: PlatformKey[] = ["greenhouse", "lever"];
const SEARCH_PLATFORMS: PlatformKey[] = [
  "linkedin", "indeed", "adzuna", "jobbank",
  "remoteok", "weworkremotely", "remotive",
  "wellfound", "builtin", "dynamitejobs",
];

export function AddPipelineModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [platforms, setPlatforms] = useState<Set<PlatformKey>>(new Set());
  const [expanding, setExpanding] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");

  const togglePlatform = (key: PlatformKey) =>
    setPlatforms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const expandKeyword = useCallback(async (kw: string) => {
    if (!kw.trim()) { setSuggestions([]); return; }
    setExpanding(true);
    try {
      const res = await fetch("/api/pipelines/expand-keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw.trim() }),
      });
      const data = await res.json();
      setSuggestions(data.titles ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setExpanding(false);
    }
  }, []);

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, keyword, platforms: Array.from(platforms) }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create pipeline");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["pipelines"] });
      onClose();
      reset();
      router.push(`/pipelines/${data.id}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  const reset = () => {
    setName(""); setKeyword(""); setPlatforms(new Set());
    setSuggestions([]); setError("");
  };

  const handleClose = () => { onClose(); reset(); };

  if (!open) return null;

  const inputCls =
    "w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-[var(--border)]">
          <h2 className="font-serif text-xl text-[var(--text-primary)]">Add Pipeline</h2>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Name <span className="text-[var(--accent-red)]">*</span>
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-1">
              Name it after the role type. Keep each pipeline focused — one pipeline per job category.
            </p>
            <input
              className={inputCls}
              placeholder="e.g., Business Analyst, Data Governance, AI Automation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Keyword */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Keyword <span className="text-[var(--accent-red)]">*</span>
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-1">
              One keyword per pipeline. Don&apos;t mix — create separate pipelines for different roles.
            </p>
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="e.g., business analyst"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => expandKeyword(keyword)}
                disabled={!keyword.trim() || expanding}
                className="shrink-0 px-3 py-2 text-xs border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-50 transition-colors"
              >
                {expanding ? "…" : "Expand"}
              </button>
            </div>
            {suggestions.length > 0 && (
              <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                {suggestions.join(", ")}
              </p>
            )}
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Platforms <span className="text-[var(--accent-red)]">*</span>
            </label>

            <div className="mb-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                End-to-end automation (search + auto-apply)
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                Jobs from these platforms can be applied to automatically.
              </p>
              <div className="space-y-1.5">
                {AUTO_PLATFORMS.map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.has(key)}
                      onChange={() => togglePlatform(key)}
                      className="w-4 h-4 accent-[var(--accent-teal)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">{PLATFORMS[key].name}</span>
                    <span className="text-xs text-[var(--accent-teal)] font-medium">⚡ Auto-apply</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Search only (manual apply)
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                Jobs will be fetched but you apply manually via the job link.
              </p>
              <div className="space-y-1.5">
                {SEARCH_PLATFORMS.map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.has(key)}
                      onChange={() => togglePlatform(key)}
                      className="w-4 h-4 accent-[var(--accent-blue)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">{PLATFORMS[key].name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-[var(--accent-red)]">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => createMut.mutate()}
            disabled={
              createMut.isPending ||
              !name.trim() ||
              !keyword.trim() ||
              platforms.size === 0
            }
            className="px-5 py-2 text-sm font-medium bg-[var(--accent-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {createMut.isPending ? "Creating…" : "Create Pipeline"}
          </button>
        </div>
      </div>
    </div>
  );
}
