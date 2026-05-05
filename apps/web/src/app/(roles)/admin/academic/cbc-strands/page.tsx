"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Subject } from "@uganda-cbc-sms/shared";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

type SubStrand = { id: string; name: string; code: string; description: string | null };
type StrandRow = {
  id: string;
  subjectId: string;
  subjectName: string;
  name: string;
  code: string;
  description: string | null;
  subStrandsCount: number;
};
type StrandDetails = StrandRow & { subStrands: SubStrand[] };
type Row = StrandRow & Record<string, unknown>;

const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAcademicCbcStrandsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [rows, setRows] = useState<StrandRow[]>([]);
  const [selected, setSelected] = useState<StrandDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StrandRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StrandRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "", subjectId: "" });
  const [subForm, setSubForm] = useState({ name: "", code: "", description: "" });
  const [subEditing, setSubEditing] = useState<SubStrand | null>(null);
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<SubStrand | null>(null);

  const subjectOptions = useMemo(
    () => subjects.filter((s) => s.level === "O_LEVEL").map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` })),
    [subjects],
  );

  const loadStrands = async (nextSubjectId: string) => {
    const url = nextSubjectId ? `/academic/cbc-strands?subjectId=${encodeURIComponent(nextSubjectId)}` : "/academic/cbc-strands";
    const strands = await apiGet<StrandRow[]>(url);
    setRows(strands);
  };

  const load = async () => {
    setErr(null);
    try {
      const s = await apiGet<Subject[]>("/academic/subjects");
      setSubjects(s);
      if (!subjectId) {
        const first = s.find((x) => x.level === "O_LEVEL");
        if (first) setSubjectId(first.id);
      }
      await loadStrands(subjectId);
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

  useEffect(() => {
    void loadStrands(subjectId).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load strands"));
  }, [subjectId]);

  const loadDetails = async (id: string) => {
    const detail = await apiGet<StrandDetails>(`/academic/cbc-strands/${encodeURIComponent(id)}`);
    setSelected(detail);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", description: "", subjectId: subjectId || subjectOptions[0]?.value || "" });
    setOpen(true);
  };

  const openEdit = (row: StrandRow) => {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code,
      description: row.description ?? "",
      subjectId: row.subjectId,
    });
    setOpen(true);
  };

  const saveStrand = async () => {
    setErr(null);
    setOk(null);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      subjectId: form.subjectId,
    };
    try {
      if (editing) {
        await apiPut(`/academic/cbc-strands/${encodeURIComponent(editing.id)}`, payload);
        setOk("Strand updated.");
      } else {
        await apiPost("/academic/cbc-strands", payload);
        setOk("Strand created.");
      }
      setOpen(false);
      await loadStrands(subjectId);
      if (selected) await loadDetails(selected.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save strand");
    }
  };

  const deleteStrand = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    setErr(null);
    try {
      await apiDelete(`/academic/cbc-strands/${encodeURIComponent(confirmDelete.id)}`);
      setConfirmDelete(null);
      if (selected?.id === confirmDelete.id) setSelected(null);
      await loadStrands(subjectId);
      setOk("Strand deleted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete strand");
    } finally {
      setBusyId(null);
    }
  };

  const saveSubStrand = async () => {
    if (!selected) return;
    setErr(null);
    const payload = {
      name: subForm.name.trim(),
      code: subForm.code.trim().toUpperCase(),
      description: subForm.description.trim() || null,
    };
    try {
      if (subEditing) {
        await apiPut(`/academic/cbc-strands/sub-strands/${encodeURIComponent(subEditing.id)}`, payload);
        setOk("Sub-strand updated.");
      } else {
        await apiPost(`/academic/cbc-strands/${encodeURIComponent(selected.id)}/sub-strands`, payload);
        setOk("Sub-strand created.");
      }
      setSubForm({ name: "", code: "", description: "" });
      setSubEditing(null);
      await loadDetails(selected.id);
      await loadStrands(subjectId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save sub-strand");
    }
  };

  const deleteSubStrand = async () => {
    if (!confirmDeleteSub || !selected) return;
    try {
      await apiDelete(`/academic/cbc-strands/sub-strands/${encodeURIComponent(confirmDeleteSub.id)}`);
      setConfirmDeleteSub(null);
      await loadDetails(selected.id);
      await loadStrands(subjectId);
      setOk("Sub-strand deleted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete sub-strand");
    }
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "Strand name" },
    { key: "code", header: "Code" },
    { key: "subjectName", header: "Subject" },
    { key: "subStrandsCount", header: "Sub-strands" },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <button type="button" className={ACTION_BTN} onClick={() => void loadDetails(r.id)}>
            View
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
    <PageWrapper title="CBC strands" description="Manage strands and sub-strands for CBC subjects">
      <div className="mb-3">
        <Link href="/admin/academic" className="text-sm font-medium text-brand hover:underline">
          ← Back to Academic
        </Link>
      </div>
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
      <Card title="Filters">
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Subject"
            options={[{ value: "", label: "All O-Level subjects" }, ...subjectOptions]}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          />
          <div className="flex items-end justify-end">
            <Button type="button" onClick={openCreate}>
              New strand
            </Button>
          </div>
        </div>
      </Card>
      <Card title={`Strands (${rows.length})`}>
        <Table columns={columns} rows={rows as Row[]} loading={loading} searchKeys={["name", "code", "subjectName"]} />
      </Card>

      {selected ? (
        <Card title={`Sub-strands: ${selected.name}`}>
          <div className="mb-3 space-y-2">
            {selected.subStrands.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sub-strands added yet.</p>
            ) : (
              selected.subStrands.map((ss) => (
                <div key={ss.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ss.code} - {ss.name}</p>
                      <p className="text-xs text-muted-foreground">{ss.description ?? "No description."}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={ACTION_BTN}
                        onClick={() => {
                          setSubEditing(ss);
                          setSubForm({ name: ss.name, code: ss.code, description: ss.description ?? "" });
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className={ACTION_DANGER_BTN} onClick={() => setConfirmDeleteSub(ss)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-3 rounded-md border border-border p-3">
            <p className="text-sm font-medium text-foreground">{subEditing ? "Edit sub-strand" : "Add sub-strand"}</p>
            <Input label="Name" value={subForm.name} onChange={(e) => setSubForm((p) => ({ ...p, name: e.target.value }))} />
            <Input
              label="Code"
              value={subForm.code}
              onChange={(e) => setSubForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Description (optional)</label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-ui placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                value={subForm.description}
                onChange={(e) => setSubForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              {subEditing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSubEditing(null);
                    setSubForm({ name: "", code: "", description: "" });
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
              <Button type="button" onClick={() => void saveSubStrand()}>
                {subEditing ? "Save sub-strand" : "Add sub-strand"}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Modal open={open} title={editing ? "Edit strand" : "New strand"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
          <Select label="Subject" options={subjectOptions} value={form.subjectId} onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))} />
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
          <Button type="button" onClick={() => void saveStrand()}>
            {editing ? "Save changes" : "Create strand"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete strand?"
        description="Deleting a strand will also remove all linked sub-strands."
        confirmLabel="Delete"
        danger
        loading={Boolean(confirmDelete && busyId === confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void deleteStrand()}
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteSub)}
        title="Delete sub-strand?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDeleteSub(null)}
        onConfirm={() => void deleteSubStrand()}
      />
    </PageWrapper>
  );
}
