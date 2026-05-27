"use client";

import type { AuditLogStats } from "@uganda-cbc-sms/shared";
export function AuditLogKpis({ stats }: { stats: AuditLogStats | undefined }) {
  const items = [
    { label: "Active logs", value: stats?.activeCount ?? "—" },
    { label: "Today", value: stats?.todayCount ?? "—" },
    { label: "Errors (24h)", value: stats?.errorsLast24h ?? "—", alert: (stats?.errorsLast24h ?? 0) > 0 },
    { label: "Warnings (24h)", value: stats?.warningsLast24h ?? "—" },
    { label: "Archived", value: stats?.archivedCount ?? "—" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              item.alert ? "text-red-600 dark:text-red-400" : "text-foreground"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
