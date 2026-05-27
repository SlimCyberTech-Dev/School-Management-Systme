"use client";

import { Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  selectedCount: number;
  view: "active" | "archived";
  busy?: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
};

export function AuditLogBulkBar({
  selectedCount,
  view,
  busy,
  onArchive,
  onDelete,
  onClear,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-10 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
      <p className="text-sm font-medium text-foreground">
        {selectedCount} log{selectedCount === 1 ? "" : "s"} selected
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={onClear}>
          Clear
        </Button>
        {view === "active" ? (
          <Button type="button" disabled={busy} loading={busy} onClick={onArchive}>
            <Archive className="mr-1 h-4 w-4" />
            Archive selected
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled={busy} loading={busy} onClick={onDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            Delete permanently
          </Button>
        )}
      </div>
    </div>
  );
}
