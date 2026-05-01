import type { ReactNode } from "react";

export function Card({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-ui">
      {title ? <h2 className="mb-3 text-lg font-semibold text-card-foreground">{title}</h2> : null}
      {children}
    </div>
  );
}
