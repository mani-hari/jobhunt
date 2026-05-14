"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SlideOver({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 transition pointer-events-none",
        open && "pointer-events-auto"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-ink-primary/10 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-[480px] max-w-[100vw] bg-bg-card border-l border-line shadow-2xl transition-transform flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {title ? (
          <div className="px-6 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-ink-primary">{title}</h2>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink-primary text-xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="px-6 py-4 border-t border-line bg-bg-primary/40">{footer}</div> : null}
      </aside>
    </div>
  );
}
