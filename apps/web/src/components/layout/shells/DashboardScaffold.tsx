import { ReactNode } from "react";
import type { DashboardMetric } from "./types";

export function DashboardHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">{title}</h1>
        <p className="font-body mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

export function KpiGrid({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors"
        >
          <p className="font-body text-sm text-muted-foreground">{metric.label}</p>
          <p className="font-heading mt-2 text-2xl font-semibold text-card-foreground">{metric.value}</p>
          {metric.helper ? (
            <p className="font-body mt-1 text-xs text-muted-foreground">{metric.helper}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function DashboardPanel({
  title,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors">
      <h2 className="font-heading text-lg font-semibold text-card-foreground">{title}</h2>
      {subtitle ? <p className="font-body mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function DashboardTwoColumn({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary: ReactNode;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="xl:col-span-2">{primary}</div>
      <div>{secondary}</div>
    </div>
  );
}
