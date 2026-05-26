"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type LogEntry = {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  category: string;
  pipelineId: string | null;
  jobTitle: string | null;
  message: string;
  detail: string | null;
  pipeline?: { name: string } | null;
};

const LEVEL_ICON: Record<string, string> = {
  info: "🟢",
  warn: "🟡",
  error: "🔴",
};

const LEVEL_LABEL: Record<string, string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

export function LogsView() {
  const qc = useQueryClient();
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (category) params.set("category", category);

  const { data: logs = [], isLoading } = useQuery<LogEntry[]>({
    queryKey: ["logs", level, category],
    queryFn: () => fetch(`/api/logs?${params}`).then((r) => r.json()),
    refetchInterval: 15_000,
  });

  const clearMut = useMutation({
    mutationFn: () => fetch("/api/logs/clear", { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const fmt = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Toronto",
    });
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-[var(--text-primary)]">Logs</h1>
        <button
          onClick={() => clearMut.mutate()}
          disabled={clearMut.isPending}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors"
        >
          {clearMut.isPending ? "Clearing…" : "Clear old logs"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="text-sm border border-[var(--border)] rounded-md px-3 py-1.5 text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
        >
          <option value="">All levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm border border-[var(--border)] rounded-md px-3 py-1.5 text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
        >
          <option value="">All categories</option>
          <option value="fetch">Fetch</option>
          <option value="score">Score</option>
          <option value="generate">Generate</option>
          <option value="apply">Apply</option>
          <option value="schedule">Schedule</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Log list */}
      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : logs.length === 0 ? (
        <div className="border border-[var(--border)] rounded-lg p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">No log entries yet.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] bg-white">
          {logs.map((entry) => (
            <div key={entry.id} className="px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{LEVEL_ICON[entry.level]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-0.5">
                    <span className="font-mono font-semibold">{LEVEL_LABEL[entry.level]}</span>
                    <span>{fmt(entry.timestamp)}</span>
                    <span className="capitalize">{entry.category}</span>
                    {entry.pipeline && (
                      <>
                        <span>·</span>
                        <span>{entry.pipeline.name}</span>
                      </>
                    )}
                    {entry.jobTitle && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[200px]">{entry.jobTitle}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-primary)]">{entry.message}</p>
                  {entry.detail && (
                    <>
                      <button
                        onClick={() => toggle(entry.id)}
                        className="text-xs text-[var(--accent-blue)] mt-1 hover:underline"
                      >
                        {expanded.has(entry.id) ? "▼ Hide detail" : "▶ Show detail"}
                      </button>
                      {expanded.has(entry.id) && (
                        <pre className="mt-2 text-xs bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                          {entry.detail}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
