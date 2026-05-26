"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Card, CardSection } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ResumeInfo {
  id: string;
  fileName: string;
  wordCount: number;
  uploadedAt: string;
  preview?: string;
}

export function ResumeManager() {
  const qc = useQueryClient();
  const { data } = useQuery<ResumeInfo | null>({
    queryKey: ["resume"],
    queryFn: async () => {
      const r = await fetch("/api/resume");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/resume", { method: "POST", body: fd });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Upload failed");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resume"] }),
  });

  const onSelect = (file?: File | null) => {
    if (file) uploadMut.mutate(file);
  };

  return (
    <Card>
      <CardSection>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onSelect(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
            dragOver ? "border-accent-blue bg-bg-selected" : "border-line bg-bg-primary"
          }`}
        >
          <div className="text-3xl mb-2">📄</div>
          <div className="font-serif text-lg text-ink-primary">Drop your resume PDF here</div>
          <div className="text-sm text-ink-secondary mt-1">or click to choose a file</div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onSelect(e.target.files?.[0])}
          />
          <div className="mt-4">
            <Button onClick={() => fileRef.current?.click()} disabled={uploadMut.isPending}>
              {uploadMut.isPending ? "Parsing…" : "Choose PDF"}
            </Button>
          </div>
          {uploadMut.isError ? (
            <div className="text-xs text-accent-red mt-3">{(uploadMut.error as Error).message}</div>
          ) : null}
        </div>

        {data ? (
          <div className="mt-6 rounded-lg border border-line bg-bg-primary p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-ink-primary">{data.fileName}</div>
                <div className="text-xs text-ink-muted">
                  Parsed {data.wordCount} words · uploaded {new Date(data.uploadedAt).toLocaleString()}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                Replace
              </Button>
            </div>
            {data.preview ? (
              <pre className="mt-3 text-xs text-ink-secondary whitespace-pre-wrap line-clamp-6 font-sans">
                {data.preview}
                {data.preview.length >= 600 ? "…" : ""}
              </pre>
            ) : null}
          </div>
        ) : null}
      </CardSection>
    </Card>
  );
}
