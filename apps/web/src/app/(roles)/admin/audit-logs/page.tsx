"use client";

import { useMemo, useState } from "react";
import type { AuditLog, AuditLogsQuery, AuditView } from "@uganda-cbc-sms/shared";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TableSkeleton } from "@/components/feedback/TableSkeleton";
import { AuditLogBulkBar } from "@/components/audit/AuditLogBulkBar";
import { AuditLogDetailDrawer } from "@/components/audit/AuditLogDetailDrawer";
import { AuditLogFilters } from "@/components/audit/AuditLogFilters";
import { AuditLogKpis } from "@/components/audit/AuditLogKpis";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuditLogMutations, useAuditLogStats, useAuditLogsList } from "@/hooks/useAuditLogs";
import { queryStatus } from "@/lib/queryStatus";

const DEFAULT_FILTERS: AuditLogsQuery = {
  page: 1,
  limit: 25,
  view: "active",
};

export default function AdminAuditLogsPage() {
  const [view, setView] = useState<AuditView>("active");
  const [draftFilters, setDraftFilters] = useState<AuditLogsQuery>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AuditLogsQuery>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<AuditLog | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const queryFilters = useMemo(
    () => ({ ...appliedFilters, view }),
    [appliedFilters, view],
  );

  const listQ = useAuditLogsList(queryFilters);
  const statsQ = useAuditLogStats();
  const mutations = useAuditLogMutations();
  const listStatus = queryStatus(listQ);

  const items = listQ.data?.items ?? [];
  const pagination = listQ.data?.pagination;

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters, page: 1 });
    setSelected([]);
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSelected([]);
  };

  const switchView = (next: AuditView) => {
    setView(next);
    setSelected([]);
    setAppliedFilters((f) => ({ ...f, page: 1 }));
    setDraftFilters((f) => ({ ...f, page: 1 }));
  };

  const archiveSelected = async () => {
    if (!selected.length) return;
    setErr(null);
    setOk(null);
    try {
      const res = await mutations.archive.mutateAsync({ ids: selected });
      setOk(`Archived ${res.archived} log${res.archived === 1 ? "" : "s"}.`);
      setSelected([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Archive failed");
    }
  };

  const deleteSelected = async () => {
    if (!selected.length) return;
    setErr(null);
    setOk(null);
    try {
      const res = await mutations.remove.mutateAsync({ ids: selected });
      setOk(`Permanently deleted ${res.deleted} log${res.deleted === 1 ? "" : "s"}.`);
      setSelected([]);
      setConfirmDelete(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <PageWrapper
      title="Audit logs"
      description="Monitor system activity, security events, and API errors. Archive old logs to reduce noise; permanently delete only from the archived view."
    >
      {err ? <Alert tone="error">{err}</Alert> : null}
      {ok ? <Alert tone="success">{ok}</Alert> : null}

      <AuditLogKpis stats={statsQ.data} />

      <div className="mt-4 flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-ui ${
            view === "active" ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => switchView("active")}
        >
          Active
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-ui ${
            view === "archived" ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => switchView("archived")}
        >
          Archived
        </button>
      </div>

      <div className="mt-4">
        <AuditLogFilters
          filters={{ ...draftFilters, view }}
          onChange={(next) => setDraftFilters((f) => ({ ...f, ...next }))}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </div>

      <AsyncContent
        status={listStatus}
        className="mt-4"
        loading={<TableSkeleton rows={10} cols={7} />}
        error={
          <ErrorState
            message={listQ.error instanceof Error ? listQ.error.message : "Failed to load audit logs"}
            onRetry={() => void listQ.refetch()}
          />
        }
      >
        {items.length === 0 ? (
          <EmptyState
            title={view === "active" ? "No active audit logs" : "No archived logs"}
            description={
              view === "active"
                ? "Activity will appear here as users sign in, change data, or when API errors occur."
                : "Archived logs appear here. You can permanently delete them when no longer needed."
            }
          />
        ) : (
          <>
            <AuditLogTable
              items={items}
              selected={selected}
              onToggle={(id) =>
                setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
              }
              onToggleAll={setSelected}
              onRowClick={setDetail}
            />
            {pagination ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pagination.page <= 1}
                    onClick={() => setAppliedFilters((f) => ({ ...f, page: f.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setAppliedFilters((f) => ({ ...f, page: f.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </AsyncContent>

      <AuditLogBulkBar
        selectedCount={selected.length}
        view={view}
        busy={mutations.archive.isPending || mutations.remove.isPending}
        onArchive={() => void archiveSelected()}
        onDelete={() => setConfirmDelete(true)}
        onClear={() => setSelected([])}
      />

      <AuditLogDetailDrawer log={detail} onClose={() => setDetail(null)} />

      <ConfirmDialog
        open={confirmDelete}
        title="Permanently delete audit logs?"
        description={`This will permanently remove ${selected.length} archived log(s). This cannot be undone.`}
        confirmLabel="Delete permanently"
        danger
        loading={mutations.remove.isPending}
        onConfirm={() => void deleteSelected()}
        onCancel={() => setConfirmDelete(false)}
      />
    </PageWrapper>
  );
}
