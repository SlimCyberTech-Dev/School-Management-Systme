"use client";

import type { AuditLog } from "@uganda-cbc-sms/shared";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS, formatRelativeTime, outcomeLabel, severityClass } from "./auditLabels";

type Props = {
  items: AuditLog[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  onRowClick: (log: AuditLog) => void;
};

export function AuditLogTable({ items, selected, onToggle, onToggleAll, onRowClick }: Props) {
  const allIds = items.map((i) => i.id);
  const allSelected = items.length > 0 && allIds.every((id) => selected.includes(id));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-10 px-3 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                aria-label="Select all"
                onChange={() => onToggleAll(allSelected ? [] : allIds)}
              />
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">When</th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Category</th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Severity</th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Action</th>
            <th className="min-w-[200px] px-3 py-2 text-left font-semibold text-muted-foreground">Message</th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Actor</th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {items.map((log, idx) => (
            <tr
              key={log.id}
              className={`cursor-pointer transition-ui hover:bg-muted/40 ${idx % 2 === 1 ? "bg-muted/10" : ""}`}
              onClick={() => onRowClick(log)}
            >
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.includes(log.id)}
                  aria-label={`Select log ${log.id}`}
                  onChange={() => onToggle(log.id)}
                />
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground" title={log.createdAt}>
                {formatRelativeTime(log.createdAt)}
              </td>
              <td className="px-3 py-2">
                <Badge>{CATEGORY_LABELS[log.category]}</Badge>
              </td>
              <td className="px-3 py-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${severityClass(log.severity)}`}>
                  {log.severity}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="font-mono text-xs">{log.action}</span>
                <div className="mt-0.5">
                  <Badge tone={log.outcome === "failure" ? "warning" : "success"}>{outcomeLabel(log.outcome)}</Badge>
                </div>
              </td>
              <td className="max-w-xs truncate px-3 py-2 text-foreground">{log.message}</td>
              <td className="px-3 py-2 text-muted-foreground">{log.actorName ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{log.ipAddress ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
