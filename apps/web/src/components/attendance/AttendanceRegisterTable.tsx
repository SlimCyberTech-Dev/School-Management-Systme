"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type AttendanceStatus = "present" | "absent" | "late";

export type RegisterStudentRow = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  status: AttendanceStatus | null;
};

const PAGE_SIZE = 50;
const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "late"];

type Props = {
  students: RegisterStudentRow[];
  statuses: Record<string, AttendanceStatus>;
  editable: boolean;
  registerStatus: "draft" | "submitted" | "locked";
  submittedAt: string | null;
  saving?: boolean;
  submitting?: boolean;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onStatusesChange: (next: Record<string, AttendanceStatus>) => void;
  onSave: () => void;
  onSubmit: () => void;
};

export function AttendanceRegisterTable({
  students,
  statuses,
  editable,
  registerStatus,
  submittedAt,
  saving,
  submitting,
  onStatusChange,
  onStatusesChange,
  onSave,
  onSubmit,
}: Props) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (r) => r.studentName.toLowerCase().includes(q) || r.studentNumber.toLowerCase().includes(q),
    );
  }, [students, search]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const pagedRows = visibleRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const allVisibleSelected =
    pagedRows.length > 0 && pagedRows.every((r) => selectedStudentIds.includes(r.studentId));

  const applyBulkStatus = (status: AttendanceStatus) => {
    if (!editable) return;
    const targetIds =
      selectedStudentIds.length > 0 ? selectedStudentIds : students.map((s) => s.studentId);
    const next = { ...statuses };
    for (const id of targetIds) next[id] = status;
    onStatusesChange(next);
  };

  return (
    <>
      {!editable ? (
        <Alert tone="info">
          This register is {registerStatus}. Edits are disabled.
          {submittedAt ? ` Submitted ${new Date(submittedAt).toLocaleString()}.` : null}
        </Alert>
      ) : null}

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[260px] max-w-md flex-1">
          <Input
            label="Search learner"
            placeholder="Name or student number…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!editable} onClick={() => applyBulkStatus("present")}>
            {selectedStudentIds.length > 0 ? "Mark selected present" : "Mark all present"}
          </Button>
          <Button variant="secondary" disabled={!editable} onClick={() => applyBulkStatus("absent")}>
            Mark {selectedStudentIds.length > 0 ? "selected" : "all"} absent
          </Button>
          <Button variant="secondary" disabled={!editable} onClick={() => applyBulkStatus("late")}>
            Mark {selectedStudentIds.length > 0 ? "selected" : "all"} late
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={!editable}
                  aria-label="Select all on this page"
                  onChange={(e) => {
                    if (!editable) return;
                    if (!e.target.checked) {
                      setSelectedStudentIds((prev) =>
                        prev.filter((id) => !pagedRows.some((r) => r.studentId === id)),
                      );
                      return;
                    }
                    setSelectedStudentIds((prev) => {
                      const set = new Set(prev);
                      for (const row of pagedRows) set.add(row.studentId);
                      return [...set];
                    });
                  }}
                />
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Student #</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Learner</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No learners match your search.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => {
                const value = statuses[row.studentId] ?? "present";
                return (
                  <tr key={row.studentId} className="transition-ui hover:bg-accent/40">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(row.studentId)}
                        disabled={!editable}
                        aria-label={`Select ${row.studentName}`}
                        onChange={(e) => {
                          if (!editable) return;
                          setSelectedStudentIds((prev) =>
                            e.target.checked
                              ? [...prev, row.studentId]
                              : prev.filter((id) => id !== row.studentId),
                          );
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.studentNumber}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{row.studentName}</td>
                    <td className="px-3 py-2">
                      <StatusToggle
                        value={value}
                        disabled={!editable}
                        onChange={(s) => onStatusChange(row.studentId, s)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {visibleRows.length > PAGE_SIZE ? (
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {pageCount} ({visibleRows.length} learners)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-border bg-card px-2 py-1 text-foreground transition-ui hover:bg-accent disabled:opacity-40"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded border border-border bg-card px-2 py-1 text-foreground transition-ui hover:bg-accent disabled:opacity-40"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" loading={saving} disabled={!editable} onClick={onSave}>
          Save draft
        </Button>
        <Button type="button" loading={submitting} disabled={!editable} onClick={onSubmit}>
          Submit register
        </Button>
      </div>
    </>
  );
}

function StatusToggle({
  value,
  disabled,
  onChange,
}: {
  value: AttendanceStatus;
  disabled?: boolean;
  onChange: (status: AttendanceStatus) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/40 p-1">
      {STATUS_OPTIONS.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onChange(s)}
          className={`rounded px-2 py-1 text-xs font-medium capitalize transition-ui ${
            value === s
              ? s === "present"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : s === "absent"
                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
