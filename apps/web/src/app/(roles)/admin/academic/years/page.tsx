"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

type Form = z.infer<typeof academicYearSchema>;
type Row = AcademicYear & Record<string, unknown>;
const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAcademicYearsPage() {
  const [rows, setRows] = useState<AcademicYear[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AcademicYear | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "", isActive: true },
  });

  const editForm = useForm<Form>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "", isActive: false },
  });

  const load = async () => {
    try {
      const r = await apiGet<AcademicYear[]>("/academic/years");
      setRows(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (v: Form) => {
    setErr(null);
    setOk(null);
    try {
      await apiPost("/academic/years", v);
      await load();
      setOk("Academic year created.");
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
      await load();
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
      await load();
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
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="New year">
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
            <Button type="submit">Create year</Button>
          </form>
        </Card>
        <Card title={`Years (${rows.length})`}>
          <Table columns={columns} rows={rows as Row[]} loading={loading} searchKeys={["name"]} />
        </Card>
      </div>
      {editing ? (
        <Card title={`Edit year: ${editing.name}`}>
          <form className="mt-4 max-w-lg space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
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
              <Button type="submit" loading={busyId === editing.id}>
                Save changes
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
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
    </PageWrapper>
  );
}
