"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

type Settings = {
  preferredLocation: string;
  openToRemote: boolean;
  minSalary: number | null;
  preferredIndustries: string[];
  dealBreakers: string | null;
  yearsExperience: number;
  keyStrengths: string[];
  careerGapNote: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  linkedInUrl: string | null;
};

type ResumeInfo = {
  id: string;
  fileName: string;
  wordCount: number;
  uploadedAt: string;
  preview: string;
} | null;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[var(--border)] rounded-lg p-6">
      <h2 className="font-serif text-lg text-[var(--text-primary)] mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">{label}</label>
      {hint && <p className="text-xs text-[var(--text-muted)] mb-1">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]";

export function SettingsView() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { data: settings } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const { data: resume } = useQuery<ResumeInfo>({
    queryKey: ["resume"],
    queryFn: () => fetch("/api/resume").then((r) => r.json()),
  });

  const [form, setForm] = useState<Partial<Settings>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: (data: Partial<Settings>) =>
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const set = (field: keyof Settings, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleTagInput = (field: "keyStrengths" | "preferredIndustries", raw: string) => {
    set(field, raw.split(",").map((s) => s.trim()).filter(Boolean));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      qc.invalidateQueries({ queryKey: ["resume"] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl text-[var(--text-primary)]">Settings</h1>

      {/* Resume */}
      <Section title="Resume">
        {resume ? (
          <div className="mb-4 p-3 bg-[var(--bg-primary)] rounded-md border border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--text-primary)]">{resume.fileName}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {resume.wordCount} words · uploaded{" "}
              {new Date(resume.uploadedAt).toLocaleDateString("en-CA")}
            </p>
            <p className="mt-2 text-xs text-[var(--text-secondary)] font-mono leading-relaxed line-clamp-3">
              {resume.preview}…
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] mb-3">No resume uploaded yet.</p>
        )}
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-sm px-4 py-2 bg-[var(--accent-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {uploading ? "Uploading…" : resume ? "Replace resume (PDF)" : "Upload resume (PDF)"}
        </button>
        {uploadError && <p className="mt-2 text-xs text-[var(--accent-red)]">{uploadError}</p>}
      </Section>

      {/* Personal info */}
      <Section title="Personal info">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input
              className={inputCls}
              value={form.firstName ?? ""}
              onChange={(e) => set("firstName", e.target.value || null)}
            />
          </Field>
          <Field label="Last name">
            <input
              className={inputCls}
              value={form.lastName ?? ""}
              onChange={(e) => set("lastName", e.target.value || null)}
            />
          </Field>
        </div>
        <Field label="Email">
          <input
            type="email"
            className={inputCls}
            value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value || null)}
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputCls}
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value || null)}
          />
        </Field>
        <Field label="LinkedIn URL">
          <input
            className={inputCls}
            value={form.linkedInUrl ?? ""}
            onChange={(e) => set("linkedInUrl", e.target.value || null)}
          />
        </Field>
      </Section>

      {/* Preferences */}
      <Section title="Job preferences">
        <Field label="Preferred location">
          <input
            className={inputCls}
            value={form.preferredLocation ?? ""}
            onChange={(e) => set("preferredLocation", e.target.value)}
          />
        </Field>
        <Field label="Open to remote">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.openToRemote ?? true}
              onChange={(e) => set("openToRemote", e.target.checked)}
              className="w-4 h-4 accent-[var(--accent-blue)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">Yes</span>
          </label>
        </Field>
        <Field label="Minimum salary (CAD)">
          <input
            type="number"
            className={inputCls}
            value={form.minSalary ?? ""}
            onChange={(e) => set("minSalary", e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. 90000"
          />
        </Field>
        <Field label="Years of experience">
          <input
            type="number"
            className={inputCls}
            value={form.yearsExperience ?? 7}
            onChange={(e) => set("yearsExperience", Number(e.target.value))}
          />
        </Field>
        <Field
          label="Preferred industries"
          hint="Comma-separated. Used for scoring."
        >
          <input
            className={inputCls}
            value={(form.preferredIndustries ?? []).join(", ")}
            onChange={(e) => handleTagInput("preferredIndustries", e.target.value)}
          />
        </Field>
        <Field
          label="Key strengths"
          hint="Comma-separated. Used for scoring and generation."
        >
          <input
            className={inputCls}
            value={(form.keyStrengths ?? []).join(", ")}
            onChange={(e) => handleTagInput("keyStrengths", e.target.value)}
          />
        </Field>
        <Field label="Deal breakers" hint="Roles or conditions to flag as poor fit.">
          <textarea
            className={inputCls}
            rows={2}
            value={form.dealBreakers ?? ""}
            onChange={(e) => set("dealBreakers", e.target.value || null)}
          />
        </Field>
        <Field
          label="Career gap note"
          hint="Used verbatim in resume summaries and cover letters."
        >
          <textarea
            className={inputCls}
            rows={2}
            value={form.careerGapNote ?? ""}
            onChange={(e) => set("careerGapNote", e.target.value)}
          />
        </Field>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => saveMut.mutate(form)}
          disabled={saveMut.isPending}
          className="px-5 py-2 bg-[var(--accent-blue)] text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saveMut.isPending ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-[var(--accent-teal)]">Saved</span>}
      </div>
    </div>
  );
}
