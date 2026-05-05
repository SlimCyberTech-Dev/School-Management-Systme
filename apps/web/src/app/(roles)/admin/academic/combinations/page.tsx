"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

type Subject = { id: string; name: string; code: string; level: "O_LEVEL" | "A_LEVEL" };
type Combination = {
  id: string;
  name: string;
  code: string;
  level: "O_LEVEL" | "A_LEVEL";
  description: string | null;
  subjects: Subject[];
};
type Row = Combination & Record<string, unknown>;

const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAcademicCombinationsPage() {
  const [rows, setRows] = useState<Combination[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Combination | null>(null);
  const [selected, setSelected] = useState<Combination | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Combination | null>(null);
  const [newSubjectId, setNewSubjectId] = useState("");
  const [form, setForm] = useState({ name: "", level: "A_LEVEL", description: "" });

  const load = async () => {
    try {
      const [c, s] = await Promise.all([apiGet<Combination[]>("/academic/combinations"), apiGet<Subject[]>("/academic/subjects")]);
      setRows(c);
      setSubjects(s);
      if (selected) {
        const fresh = c.find((x) => x.id === selected.id) ?? null;
        setSelected(fresh);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subjectCandidates = useMemo(() => {
    if (!selected) return [];
    const assigned = new Set(selected.subjects.map((s) => s.id));
    return subjects.filter((s) => s.level === selected.level && !assigned.has(s.id));
  }, [selected, subjects]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", level: "A_LEVEL", description: "" });
    setOpen(true);
  };

  const openEdit = (row: Combination) => {
    setEditing(row);
    setForm({
      name: row.name,
      level: row.level,
      description: row.description ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setErr(null);
    setOk(null);
    const payload = {
      name: form.name.trim(),
      level: form.level as "O_LEVEL" | "A_LEVEL",
      description: form.description.trim() || null,
      subjects: editing?.subjects.map((s) => s.id) ?? [],
    };
    try {
      if (editing) {
        await apiPut(`/academic/combinations/${encodeURIComponent(editing.id)}`, payload);
        setOk("Combination updated.");
      } else {
        await apiPost("/academic/combinations", payload);
        setOk("Combination created.");
      }
      setOpen(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    setErr(null);
    setOk(null);
    try {
      await apiDelete(`/academic/combinations/${encodeURIComponent(confirmDelete.id)}`);
      setConfirmDelete(null);
      if (selected?.id === confirmDelete.id) setSelected(null);
      await load();
      setOk("Combination deleted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const addSubject = async () => {
    if (!selected || !newSubjectId) return;
    setErr(null);
    try {
      const next = await apiPost<Combination>(`/academic/combinations/${encodeURIComponent(selected.id)}/subjects`, {
        subjectId: newSubjectId,
      });
      setSelected(next);
      setRows((prev) => prev.map((x) => (x.id === next.id ? next : x)));
      setNewSubjectId("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add subject");
    }
  };

  const removeSubject = async (subjectId: string) => {
    if (!selected) return;
    setErr(null);
    try {
      const next = await apiDelete<Combination>(
        `/academic/combinations/${encodeURIComponent(selected.id)}/subjects/${encodeURIComponent(subjectId)}`,
      );
      setSelected(next);
      setRows((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to remove subject");
    }
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "level", header: "Level", render: (r) => <Badge>{r.level === "A_LEVEL" ? "A-Level" : "O-Level"}</Badge> },
    { key: "subjectsCount", header: "Subjects", render: (r) => r.subjects.length },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <button type="button" className={ACTION_BTN} onClick={() => setSelected(r)}>
            Manage subjects
          </button>
          <button type="button" className={ACTION_BTN} onClick={() => openEdit(r)}>
            Edit
          </button>
          <button type="button" className={ACTION_DANGER_BTN} disabled={busyId === r.id} onClick={() => setConfirmDelete(r)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Subject combinations" description="Manage O-Level and A-Level combinations">
      <div className="mb-3">
        <Link href="/admin/academic" className="text-sm font-medium text-brand hover:underline">
          ← Back to Academic
        </Link>
      </div>
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
      <Card title={`Combinations (${rows.length})`}>
        <div className="mb-3 flex justify-end">
          <Button type="button" onClick={openCreate}>
            New combination
          </Button>
        </div>
        <Table columns={columns} rows={rows as Row[]} loading={loading} searchKeys={["name", "code"]} />
      </Card>

      {selected ? (
        <Card title={`Combination subjects: ${selected.code}`}>
          <p className="mb-3 text-sm text-muted-foreground">{selected.name}</p>
          <div className="mb-3 flex items-end gap-2">
            <div className="flex-1">
              <Select
                label="Add subject"
                options={[{ value: "", label: "Select subject..." }, ...subjectCandidates.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))]}
                value={newSubjectId}
                onChange={(e) => setNewSubjectId(e.target.value)}
              />
            </div>
            <Button type="button" disabled={!newSubjectId} onClick={() => void addSubject()}>
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {selected.subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
            ) : (
              selected.subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-2">
                  <span className="text-sm text-foreground">{s.code} - {s.name}</span>
                  <button type="button" className={ACTION_DANGER_BTN} onClick={() => void removeSubject(s.id)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}

      <Modal open={open} title={editing ? "Edit combination" : "New combination"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          {!editing ? (
            <p className="text-xs text-muted-foreground">
              Code is auto-generated uniquely from the name.
            </p>
          ) : null}
          <Select
            label="Level"
            options={[
              { value: "O_LEVEL", label: "O-Level" },
              { value: "A_LEVEL", label: "A-Level" },
            ]}
            value={form.level}
            onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Description (optional)</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-ui placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()}>
            {editing ? "Save changes" : "Create combination"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete combination?"
        description="This removes the combination and its subject links."
        confirmLabel="Delete"
        danger
        loading={Boolean(confirmDelete && busyId === confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
      />
    </PageWrapper>
  );
}
