"use client";

import type { AuditLog } from "@uganda-cbc-sms/shared";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABELS, outcomeLabel, severityClass } from "./auditLabels";

export function AuditLogDetailDrawer({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">Log details</h2>
          <Button type="button" variant="secondary" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${severityClass(log.severity)}`}>
              {log.severity}
            </span>
            <Badge tone={log.outcome === "failure" ? "warning" : "success"}>{outcomeLabel(log.outcome)}</Badge>
            <Badge>{CATEGORY_LABELS[log.category]}</Badge>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Action</p>
            <p className="font-mono text-sm">{log.action}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Message</p>
            <p className="text-foreground">{log.message}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Actor</p>
              <p>{log.actorName ?? "—"}</p>
              {log.actorEmail ? <p className="text-xs text-muted-foreground">{log.actorEmail}</p> : null}
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Target user</p>
              <p>{log.targetUserName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">IP address</p>
              <p className="font-mono text-xs">{log.ipAddress ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">When</p>
              <p>{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {log.httpMethod || log.httpPath ? (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">HTTP</p>
              <p className="font-mono text-xs">
                {log.httpMethod} {log.httpPath}
                {log.httpStatus != null ? ` → ${log.httpStatus}` : ""}
              </p>
            </div>
          ) : null}
          {log.userAgent ? (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">User agent</p>
              <p className="break-all text-xs text-muted-foreground">{log.userAgent}</p>
            </div>
          ) : null}
          {(log.resourceType || log.resourceId) && (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Resource</p>
              <p className="font-mono text-xs">
                {log.resourceType ?? "—"} {log.resourceId ?? ""}
              </p>
            </div>
          )}
          {log.metadata && Object.keys(log.metadata).length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Metadata</p>
              <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/30 p-2 text-xs">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          ) : null}
          {log.archivedAt ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
              Archived {new Date(log.archivedAt).toLocaleString()}
              {log.archivedByName ? ` by ${log.archivedByName}` : ""}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
