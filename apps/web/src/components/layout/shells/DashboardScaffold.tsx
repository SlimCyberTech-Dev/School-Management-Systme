import { ReactNode } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { KpiSkeleton } from "@/components/feedback/KpiSkeleton";
import { Skeleton } from "@/components/feedback/Skeleton";
import type { DashboardMetric } from "./types";

export function DashboardHeader({
  title,
  description,
  eyebrow,
  meta,
  actions,
}: {
  title: string;
  description?: string;
  /** Small label above the title (e.g. role or area). */
  eyebrow?: string;
  /** Chips or one-line context under the description. */
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      aria-labelledby="dashboard-page-title"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.07] via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
        <div className="min-w-0 space-y-3">
          {eyebrow ? (
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
          ) : null}
          <div className="space-y-1.5">
            <h1
              id="dashboard-page-title"
              className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-tight"
            >
              {title}
            </h1>
            {description ? (
              <p className="font-body max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {meta ? <div className="flex flex-wrap items-center gap-x-3 gap-y-2">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end [&_a]:inline-flex [&_button]:shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function KpiGrid({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-xl border border-border bg-card p-4 transition-ui">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
          <p className="font-heading mt-2 text-2xl font-semibold text-card-foreground">{metric.value}</p>
          {metric.delta ? (
            <span
              className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                metric.deltaTone === "positive"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : metric.deltaTone === "negative"
                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {metric.delta}
            </span>
          ) : null}
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
    <section className="overflow-hidden rounded-xl border border-border bg-card transition-ui">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-heading text-sm font-medium text-card-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </header>
      <div className="px-5 py-4">{children}</div>
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

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <KpiSkeleton />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <Skeleton.Line className="w-36" />
        </div>
        <div className="space-y-3 px-5 py-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton.Block key={idx} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use ErrorState from @/components/feedback */
export function DashboardErrorState(props: { message: string; onRetry?: () => void }) {
  return <ErrorState {...props} />;
}
