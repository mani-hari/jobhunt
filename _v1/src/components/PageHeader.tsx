import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-6 px-8 pt-8 pb-6 border-b border-line bg-bg-primary/70 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink-primary">{title}</h1>
        {subtitle ? <p className="text-sm text-ink-secondary mt-1">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
