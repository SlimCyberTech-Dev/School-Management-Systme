"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { subjectSchema } from "@uganda-cbc-sms/shared";
import type { Subject } from "@uganda-cbc-sms/shared";
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

type Form = z.infer<typeof subjectSchema>;
type Row = Subject & Record<string, unknown>;
const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAcademicSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Subject | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "", code: "", level: "o_level" },
  });
  const editForm = useForm<Form>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "", code: "", level: "o_level" },
  });

  const load = async () => {
    try {
      const s = await apiGet<Subject[]>("/academic/subjects");
      setSubjects(s);
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
      await apiPost("/academic/subjects", v);
      await load();
      setOk("Subject created.");
      form.reset({ name: "", code: "", level: "o_level" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const startEdit = (row: Subject) => {
    setEditing(row);
    editForm.reset({ name: row.name, code: row.code, level: row.level });
  };

  const onEdit = async (v: Form) => {
    if (!editing) return;
    setErr(null);
    setOk(null);
    setBusyId(editing.id);
    try {
      await apiPatch(`/academic/subjects/${encodeURIComponent(editing.id)}`, v);
      await load();
      setEditing(null);
      setOk("Subject updated.");
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
      await apiDelete(`/academic/subjects/${encodeURIComponent(confirmDelete.id)}`);
      await load();
      setConfirmDelete(null);
      setOk("Subject deleted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "level", header: "Level" },
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
    <PageWrapper title="Subjects" description="Subject catalogue">
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="New subject">
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <Input label="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
            <Input label="Code" {...form.register("code")} error={form.formState.errors.code?.message} />
            <Select
              label="Level"
              options={[
                { value: "o_level", label: "O-Level / CBC" },
                { value: "a_level", label: "A-Level" },
              ]}
              {...form.register("level")}
            />
            <Button type="submit">Create subject</Button>
          </form>
        </Card>
        <Card title={`Subjects (${subjects.length})`}>
          <Table columns={columns} rows={subjects as Row[]} loading={loading} searchKeys={["name", "code"]} />
        </Card>
      </div>
      {editing ? (
        <Card title={`Edit subject: ${editing.code}`}>
          <form className="mt-4 max-w-lg space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
            <Input label="Name" {...editForm.register("name")} error={editForm.formState.errors.name?.message} />
            <Input label="Code" {...editForm.register("code")} error={editForm.formState.errors.code?.message} />
            <Select
              label="Level"
              options={[
                { value: "o_level", label: "O-Level / CBC" },
                { value: "a_level", label: "A-Level" },
              ]}
              {...editForm.register("level")}
            />
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
        title="Delete subject?"
        description="This cannot be undone. If linked classes/assessments exist, deletion will be blocked."
        confirmLabel="Delete"
        danger
        loading={Boolean(confirmDelete && busyId === confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
      />
    </PageWrapper>
  );
}
