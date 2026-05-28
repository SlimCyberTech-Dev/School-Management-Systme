"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FeeScheduleStatus, FeeStructure } from "@uganda-cbc-sms/shared";
import type { ClassEnrollmentSummary } from "@uganda-cbc-sms/shared";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, type Column } from "@/components/ui/Table";
import { useFeeActions } from "@/hooks/useFees";
import { formatUgx } from "@/lib/formatMoney";
import { getApiErrorMessage } from "@/lib/api";
import { feeScheduleStatusLabel, feeScheduleStatusTone, isFeeStructureLocked } from "@/lib/feeSchedule";
import { toast } from "@/lib/toast";

function classLabel(row: FeeStructure) {
  const name = row.className ?? "Class";
  return row.classStream ? `${name} · ${row.classStream}` : name;
}

export function FeeStructureTable({
  rows,
  enrollment,
  scheduleByKey,
  yearId,
  onPublished,
}: {
  rows: FeeStructure[];
  enrollment: ClassEnrollmentSummary[];
  /** classId:termId → publish workflow status */
  scheduleByKey?: Map<string, FeeScheduleStatus>;
  yearId?: string;
  onPublished?: () => void;
}) {
  const actions = useFeeActions();
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const enrollmentByClass = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of enrollment) m.set(c.classId, c.activeCount);
    return m;
  }, [enrollment]);

  const groups = useMemo(() => {
    const map = new Map<string, FeeStructure[]>();
    for (const r of rows) {
      const key = `${r.classId}:${r.termId}`;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, items]) => {
      const total = items.reduce((s, i) => s + Number(i.amount), 0);
      const first = items[0]!;
      const scheduleStatus = scheduleByKey?.get(key) ?? "draft";
      const locked = isFeeStructureLocked(scheduleStatus);
      return {
        key,
        classId: first.classId,
        termId: first.termId,
        items,
        total,
        label: `${classLabel(first)} · ${first.termLabel ?? "Term"}${first.yearName ? ` (${first.yearName})` : ""}`,
        studentCount: enrollmentByClass.get(first.classId) ?? 0,
        locked,
        scheduleStatus,
      };
    });
  }, [rows, enrollmentByClass, scheduleByKey]);

  const publishHref = (classId: string, termId: string) => {
    const p = new URLSearchParams();
    if (yearId) p.set("yearId", yearId);
    p.set("termId", termId);
    p.set("classId", classId);
    return `/admin/fees/publish?${p.toString()}`;
  };

  const publishGroup = (g: (typeof groups)[number]) => {
    toast.confirm({
      title: "Publish fee schedule?",
      description: `Publish ${g.label} so bursars can bill students at ${formatUgx(g.total)} UGX each?`,
      confirmLabel: "Publish now",
      onConfirm: async () => {
        try {
          await actions.publishSchedule.mutateAsync({ classId: g.classId, termId: g.termId });
          toast.success("Published. Bursars can bill this class.", "Done");
          onPublished?.();
        } catch (e) {
          toast.error(getApiErrorMessage(e), "Could not publish");
        }
      },
    });
  };

  const openEdit = (row: FeeStructure) => {
    setEditing(row);
    setEditAmount(String(Math.round(Number(row.amount))));
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await actions.updateStructure.mutateAsync({
        structureId: editing.id,
        body: { amount: editAmount },
      });
      toast.success("Amount updated.", "Saved");
      setEditing(null);
    } catch (e) {
      toast.error(getApiErrorMessage(e), "Could not update");
    }
  };

  const confirmDelete = (row: FeeStructure) => {
    const key = `${row.classId}:${row.termId}`;
    const scheduleStatus = scheduleByKey?.get(key);
    if (isFeeStructureLocked(scheduleStatus)) {
      toast.error(
        scheduleStatus === "published"
          ? "This schedule is published. Unpublish from Publish & bill before removing categories."
          : "Invoices have been issued for this class and term. Fee categories can no longer be removed.",
        "Structure locked",
      );
      return;
    }
    toast.confirm({
      title: "Remove fee category?",
      description: `Remove ${row.category} (${formatUgx(row.amount)} UGX) for ${classLabel(row)}?`,
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          await actions.deleteStructure.mutateAsync(row.id);
          toast.success("Fee category removed.", "Removed");
        } catch (e) {
          toast.error(getApiErrorMessage(e), "Could not remove");
        }
      },
    });
  };

  const columns: Column<FeeStructure>[] = [
    { key: "category", header: "Category", render: (r) => r.category },
    {
      key: "amount",
      header: "Amount (UGX)",
      render: (r) => <span className="tabular-nums font-medium">{formatUgx(r.amount)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => {
        const locked = isFeeStructureLocked(scheduleByKey?.get(`${r.classId}:${r.termId}`));
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              disabled={locked}
              onClick={() => openEdit(r)}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs text-red-700 dark:text-red-400"
              disabled={locked}
              onClick={() => confirmDelete(r)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No fee structure rows match your filters.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.key} className="rounded-lg border border-border">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{g.label}</p>
                <Badge tone={feeScheduleStatusTone(g.scheduleStatus)}>
                  {feeScheduleStatusLabel(g.scheduleStatus)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {g.studentCount} active student{g.studentCount === 1 ? "" : "s"} · Total per student:{" "}
                <span className="font-semibold tabular-nums">{formatUgx(g.total)} UGX</span>
              </p>
            </div>
            <div className="flex max-w-md shrink-0 flex-col items-end gap-2">
              {g.scheduleStatus === "draft" ? (
                <Button
                  className="!px-3 !py-1.5 text-sm"
                  loading={actions.publishSchedule.isPending}
                  onClick={() => publishGroup(g)}
                >
                  Publish for bursars
                </Button>
              ) : null}
              {g.scheduleStatus === "published" ? (
                <Link
                  href={publishHref(g.classId, g.termId)}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Bill class →
                </Link>
              ) : null}
              {g.locked ? (
                <Alert tone="info">
                  {g.scheduleStatus === "published"
                    ? "Published — bursars can bill"
                    : "Billed — locked for edits"}
                </Alert>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Draft —{" "}
                  <Link href={publishHref(g.classId, g.termId)} className="text-brand hover:underline">
                    publish when ready
                  </Link>
                </span>
              )}
            </div>
          </div>
          <div className="p-2">
            <Table
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              rows={g.items as unknown as Record<string, unknown>[]}
              emptyState={null}
            />
          </div>
        </div>
      ))}

      <Modal open={Boolean(editing)} title="Edit amount" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {editing.category} · {classLabel(editing)}
            </p>
            <Input
              label="Amount (UGX)"
              type="number"
              min={1}
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <Button loading={actions.updateStructure.isPending} onClick={() => void saveEdit()}>
                Save
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
