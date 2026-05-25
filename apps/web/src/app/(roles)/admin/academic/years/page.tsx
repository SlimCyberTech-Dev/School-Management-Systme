"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useForm } from "react-hook-form";
import { academicYearSchema } from "@uganda-cbc-sms/shared";
import type { AcademicYear } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

type Form = z.infer<typeof academicYearSchema>;
type Row = AcademicYear & Record<string, unknown>;
const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAcademicYearsPage() {
  const yearsQ = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => apiGet<AcademicYear[]>("/academic/years"),
  });
  const rows = yearsQ.data ?? [];
  const loading = yearsQ.isPending;
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AcademicYear | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "", isActive: true },
  });

  const editForm = useForm<Form>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "", isActive: false },
  });

  const reload = () => void yearsQ.refetch();

  const onSubmit = async (v: Form) => {
    setErr(null);
    setOk(null);
    try {
      await apiPost("/academic/years", v);
      reload();
      setOk("Academic year created.");
      setCreateOpen(false);
      form.reset({ name: "", startDate: "", endDate: "", isActive: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const startEdit = (row: AcademicYear) => {
    setEditing(row);
    editForm.reset({
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      isActive: row.isActive,
    });
  };

  const onEdit = async (v: Form) => {
    if (!editing) return;
    setErr(null);
    setOk(null);
    setBusyId(editing.id);
    try {
      await apiPatch(`/academic/years/${encodeURIComponent(editing.id)}`, v);
      reload();
      setOk("Academic year updated.");
      setEditing(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setErr(null);
    setOk(null);
    setBusyId(confirmDelete.id);
    try {
      await apiDelete(`/academic/years/${encodeURIComponent(confirmDelete.id)}`);
      reload();
      setOk("Academic year deleted.");
      setConfirmDelete(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "Name" },
    { key: "startDate", header: "Start" },
    { key: "endDate", header: "End" },
    { key: "isActive", header: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-3">
          <button
            type="button"
            className={ACTION_BTN}
            disabled={busyId === r.id}
            onClick={() => startEdit(r)}
          >
            Edit
          </button>
          <button
            type="button"
            className={ACTION_DANGER_BTN}
            disabled={busyId === r.id}
            onClick={() => setConfirmDelete(r)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Academic years" description="Create school years">
      <div className="mb-3">
        <Link href="/admin/academic" className="text-sm font-medium text-brand hover:underline">
          ← Back to Academic
        </Link>
      </div>
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
      <Card title={`Years (${rows.length})`}>
        <div className="mb-3 flex justify-end">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Add new record
          </Button>
        </div>
        <Table
          columns={columns}
          rows={rows as Row[]}
          loading={loading}
          searchKeys={["name"]}
          emptyState={
            <EmptyState
              title="No academic years configured"
              description="Create a school year before adding terms, classes, and assessments."
              icon={Calendar}
              action={{ label: "Add academic year", onClick: () => setCreateOpen(true) }}
            />
          }
        />
      </Card>
      <Modal open={Boolean(editing)} title={`Edit year${editing ? `: ${editing.name}` : ""}`} onClose={() => setEditing(null)}>
        <form className="mt-1 space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
            <Input label="Name" {...editForm.register("name")} error={editForm.formState.errors.name?.message} />
            <Input
              label="Start date"
              type="date"
              {...editForm.register("startDate")}
              error={editForm.formState.errors.startDate?.message}
            />
            <Input
              label="End date"
              type="date"
              {...editForm.register("endDate")}
              error={editForm.formState.errors.endDate?.message}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input className="h-4 w-4 rounded border-border bg-background" type="checkbox" {...editForm.register("isActive")} />
              Active
            </label>
            <div className="flex gap-2">
              <Button type="submit" loading={Boolean(editing && busyId === editing.id)}>
                Save changes
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete academic year?"
        description="This cannot be undone. If linked terms/classes exist, deletion will be blocked."
        confirmLabel="Delete"
        danger
        loading={Boolean(confirmDelete && busyId === confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
      />
      <Modal open={createOpen} title="New year" onClose={() => setCreateOpen(false)}>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Input label="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <Input
            label="Start date"
            type="date"
            {...form.register("startDate")}
            error={form.formState.errors.startDate?.message}
          />
          <Input
            label="End date"
            type="date"
            {...form.register("endDate")}
            error={form.formState.errors.endDate?.message}
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input className="h-4 w-4 rounded border-border bg-background" type="checkbox" {...form.register("isActive")} />
            Active
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create year</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
