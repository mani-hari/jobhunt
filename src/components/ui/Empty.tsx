import type { ReactNode } from "react";

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-line rounded-xl bg-bg-card px-8 py-14 text-center">
      <h3 className="font-serif text-lg font-semibold text-ink-primary">{title}</h3>
      {body ? <p className="text-sm text-ink-secondary mt-2 max-w-md mx-auto">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
