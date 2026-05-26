"use client";

import type { ReactNode } from "react";

export function ChartPanel({
  title,
  subtitle,
  children,
  empty,
  chartHeight = 280,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  empty?: boolean;
  chartHeight?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {empty ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No data for the selected filters</p>
      ) : (
        <div className="w-full" style={{ height: chartHeight }}>
          {children}
        </div>
      )}
    </div>
  );
}
