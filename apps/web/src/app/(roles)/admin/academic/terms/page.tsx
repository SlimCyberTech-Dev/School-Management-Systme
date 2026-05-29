"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { termSchema } from "@uganda-cbc-sms/shared";
import type { AcademicYear, Term } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { useAcademicMutation } from "@/hooks/useAcademicMutation";
import { apiDelete, apiGet, apiPatch, apiPost, getApiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

type Form = z.infer<typeof termSchema>;

type Row = Term & Record<string, unknown>;
const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

function isoDateInput(value: string): string {
  return value.slice(0, 10);
}

export default function AdminAcademicTermsPage() {
  const { creating, saving, deleting, runCreate, runSave, runDelete } = useAcademicMutation();
  const [terms, setTerms] = useState<Term[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Term | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Term | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      academicYearId: "",
      termNumber: 1,
      startDate: "",
      endDate: "",
      isActive: true,
    },
  });
  const editForm = useForm<Form>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      academicYearId: "",
      termNumber: 1,
      startDate: "",
      endDate: "",
      isActive: false,
    },
  });

  const load = useCallback(async () => {
    try {
      const [t, y] = await Promise.all([
        apiGet<Term[]>("/academic/terms"),
        apiGet<AcademicYear[]>("/academic/years"),
      ]);
      setTerms(t);
      setYears(y);
      if (y[0] && !form.getValues("academicYearId")) {
        form.setValue("academicYearId", y[0].id);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e), "Could not load terms");
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (v: Form) => {
    const created = await runCreate(
      () => apiPost<Term>("/academic/terms", v),
      {
        title: "Term created",
        message: `Term ${v.termNumber} has been added to the school calendar.`,
      },
    );
    if (!created) return;
    await load();
    setCreateOpen(false);
  };

  const startEdit = (row: Term) => {
    setEditing(row);
    editForm.reset({
      academicYearId: row.academicYearId,
      termNumber: row.termNumber,
      startDate: isoDateInput(row.startDate),
      endDate: isoDateInput(row.endDate),
      isActive: row.isActive,
    });
  };

  const onEdit = async (v: Form) => {
    if (!editing) return;
    const updated = await runSave(
      () => apiPatch<Term>(`/academic/terms/${encodeURIComponent(editing.id)}`, v),
      {
        title: "Term updated",
        message: `Term ${v.termNumber} has been saved.`,
      },
    );
    if (!updated) return;
    await load();
    setEditing(null);
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const ok = await runDelete(
      () => apiDelete(`/academic/terms/${encodeURIComponent(confirmDelete.id)}`),
      {
        title: "Term deleted",
        message: `Term ${confirmDelete.termNumber} was removed.`,
      },
    );
    if (!ok) return;
    await load();
    setConfirmDelete(null);
  };

  const columns: Column<Row>[] = [
    { key: "termNumber", header: "Term" },
    {
      key: "academicYearId",
      header: "Year",
      render: (r) => years.find((y) => y.id === r.academicYearId)?.name ?? "—",
    },
    { key: "startDate", header: "Start", render: (r) => isoDateInput(String(r.startDate)) },
    { key: "endDate", header: "End", render: (r) => isoDateInput(String(r.endDate)) },
    { key: "isActive", header: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-3">
          <button
            type="button"
            className={ACTION_BTN}
            disabled={saving || deleting}
            onClick={() => startEdit(r)}
          >
            Edit
          </button>
          <button
            type="button"
            className={ACTION_DANGER_BTN}
            disabled={saving || deleting}
            onClick={() => setConfirmDelete(r)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Terms" description="Terms within an academic year">
      <div className="mb-3">
        <Link href="/admin/academic" className="text-sm font-medium text-brand hover:underline">
          ← Back to Academic
        </Link>
      </div>
      <Card title={`Terms (${terms.length})`}>
        <div className="mb-3 flex justify-end">
          <Button type="button" onClick={() => setCreateOpen(true)} disabled={years.length === 0}>
            Add new record
          </Button>
        </div>
        {years.length === 0 && !loading ? (
          <p className="mb-3 text-sm text-muted-foreground">
            Create an academic year first, then add terms.
          </p>
        ) : null}
        <Table columns={columns} rows={terms as Row[]} loading={loading} />
      </Card>
      <Modal
        open={Boolean(editing)}
        title={`Edit term${editing ? ` ${editing.termNumber}` : ""}`}
        busy={saving}
        onClose={() => setEditing(null)}
      >
        <form className="mt-1 space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
          <fieldset className="space-y-3" disabled={saving}>
            <Select
              label="Academic year"
              options={years.map((y) => ({ value: y.id, label: y.name }))}
              {...editForm.register("academicYearId")}
            />
            <Select
              label="Term number"
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
              ]}
              value={String(editForm.watch("termNumber") ?? 1)}
              onChange={(e) => {
                const n = Number(e.target.value);
                editForm.setValue("termNumber", n as 1 | 2 | 3, { shouldValidate: true });
              }}
            />
            <Input label="Start date" type="date" {...editForm.register("startDate")} />
            <Input label="End date" type="date" {...editForm.register("endDate")} />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input className="h-4 w-4 rounded border-border bg-background" type="checkbox" {...editForm.register("isActive")} />
              Active
            </label>
          </fieldset>
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete term?"
        description="This cannot be undone. If linked records exist, deletion will be blocked."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
      />
      <Modal open={createOpen} title="New term" busy={creating} onClose={() => setCreateOpen(false)}>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset className="space-y-3" disabled={creating}>
            <Select
              label="Academic year"
              options={years.map((y) => ({ value: y.id, label: y.name }))}
              {...form.register("academicYearId")}
            />
            <Select
              label="Term number"
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
              ]}
              value={String(form.watch("termNumber") ?? 1)}
              onChange={(e) => {
                const n = Number(e.target.value);
                form.setValue("termNumber", n as 1 | 2 | 3, { shouldValidate: true });
              }}
            />
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
          </fieldset>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={creating} onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create term
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
