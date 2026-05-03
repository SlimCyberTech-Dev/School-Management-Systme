"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { termSchema } from "@uganda-cbc-sms/shared";
import type { AcademicYear, Term } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

type Form = z.infer<typeof termSchema>;

type Row = Term & Record<string, unknown>;
const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAcademicTermsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Term | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Term | null>(null);

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

  const load = async () => {
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
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, []);

  const onSubmit = async (v: Form) => {
    setErr(null);
    setOk(null);
    try {
      await apiPost("/academic/terms", v);
      await load();
      setOk("Term created.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const startEdit = (row: Term) => {
    setEditing(row);
    editForm.reset({
      academicYearId: row.academicYearId,
      termNumber: row.termNumber,
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
      await apiPatch(`/academic/terms/${encodeURIComponent(editing.id)}`, v);
      await load();
      setEditing(null);
      setOk("Term updated.");
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
      await apiDelete(`/academic/terms/${encodeURIComponent(confirmDelete.id)}`);
      await load();
      setConfirmDelete(null);
      setOk("Term deleted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Row>[] = [
    { key: "termNumber", header: "Term" },
    {
      key: "academicYearId",
      header: "Year",
      render: (r) => years.find((y) => y.id === r.academicYearId)?.name ?? "—",
    },
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
    <PageWrapper title="Terms" description="Terms within an academic year">
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="New term">
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
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
            <Button type="submit">Create term</Button>
          </form>
        </Card>
        <Card title={`Terms (${terms.length})`}>
          <Table columns={columns} rows={terms as Row[]} loading={loading} />
        </Card>
      </div>
      {editing ? (
        <Card title={`Edit term ${editing.termNumber}`}>
          <form className="mt-4 max-w-lg space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
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
        title="Delete term?"
        description="This cannot be undone. If linked records exist, deletion will be blocked."
        confirmLabel="Delete"
        danger
        loading={Boolean(confirmDelete && busyId === confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
      />
    </PageWrapper>
  );
}
