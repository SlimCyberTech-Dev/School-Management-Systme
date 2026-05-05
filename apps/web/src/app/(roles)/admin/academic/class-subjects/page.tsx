"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AcademicYear, SchoolClass, Subject, UserPublic } from "@uganda-cbc-sms/shared";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

type Assignment = {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string | null;
  subjectName: string;
  subjectCode: string;
  teacherName: string | null;
};

type Row = Assignment & Record<string, unknown>;

const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAcademicClassSubjectsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserPublic[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [teacherId, setTeacherId] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<Assignment | null>(null);

  const selectedClass = useMemo(() => classes.find((c) => c.id === classId) ?? null, [classes, classId]);
  const filteredSubjects = useMemo(
    () => subjects.filter((s) => !selectedClass || s.level === selectedClass.level),
    [subjects, selectedClass],
  );
  const teacherOptions = useMemo(
    () => [
      { value: "", label: "— Unassigned —" },
      ...teachers
        .filter((u) => ["subject_teacher", "headteacher", "admin"].includes(u.role))
        .map((u) => ({ value: u.id, label: `${u.fullName} (${u.role})` })),
    ],
    [teachers],
  );

  const loadLookups = async () => {
    const [y, c, s, u] = await Promise.all([
      apiGet<AcademicYear[]>("/academic/years"),
      apiGet<SchoolClass[]>("/academic/classes"),
      apiGet<Subject[]>("/academic/subjects"),
      apiGet<UserPublic[]>("/users"),
    ]);
    setYears(y);
    setClasses(c);
    setSubjects(s);
    setTeachers(u);
    if (!academicYearId && y[0]) setAcademicYearId(y[0].id);
    if (!classId && c[0]) setClassId(c[0].id);
  };

  const loadAssignments = async (nextYearId: string, nextClassId: string) => {
    if (!nextYearId || !nextClassId) {
      setAssignments([]);
      return;
    }
    const q = `classId=${encodeURIComponent(nextClassId)}&academicYearId=${encodeURIComponent(nextYearId)}`;
    const rows = await apiGet<Assignment[]>(`/academic/class-subjects?${q}`);
    setAssignments(rows);
  };

  const load = async () => {
    setErr(null);
    try {
      await loadLookups();
      await loadAssignments(academicYearId, classId);
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
    if (!academicYearId || !classId) return;
    void loadAssignments(academicYearId, classId).catch((e) => {
      setErr(e instanceof Error ? e.message : "Failed to load assignments");
    });
  }, [academicYearId, classId]);

  const onBulkAssign = async () => {
    if (!academicYearId || !classId || selectedSubjects.length === 0) return;
    setErr(null);
    setOk(null);
    try {
      await apiPost("/academic/class-subjects/bulk", {
        classId,
        academicYearId,
        subjectIds: selectedSubjects,
      });
      await loadAssignments(academicYearId, classId);
      setAssignOpen(false);
      setSelectedSubjects([]);
      setOk("Subjects assigned to class.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bulk assignment failed");
    }
  };

  const onSaveTeacher = async () => {
    if (!editing) return;
    setErr(null);
    setOk(null);
    setBusyId(editing.id);
    try {
      await apiPut(`/academic/class-subjects/${encodeURIComponent(editing.id)}`, {
        teacherId: teacherId || null,
      });
      await loadAssignments(academicYearId, classId);
      setEditing(null);
      setTeacherId("");
      setOk("Teacher assignment updated.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update assignment");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async () => {
    if (!confirmDelete) return;
    setErr(null);
    setOk(null);
    setBusyId(confirmDelete.id);
    try {
      await apiDelete(`/academic/class-subjects/${encodeURIComponent(confirmDelete.id)}`);
      await loadAssignments(academicYearId, classId);
      setConfirmDelete(null);
      setOk("Assignment removed.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to remove assignment");
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Row>[] = [
    { key: "subjectName", header: "Subject" },
    { key: "subjectCode", header: "Code" },
    { key: "teacherName", header: "Teacher", render: (r) => r.teacherName ?? "— Unassigned —" },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <button
            type="button"
            className={ACTION_BTN}
            disabled={busyId === r.id}
            onClick={() => {
              setEditing(r);
              setTeacherId(r.teacherId ?? "");
            }}
          >
            Edit teacher
          </button>
          <button
            type="button"
            className={ACTION_DANGER_BTN}
            disabled={busyId === r.id}
            onClick={() => setConfirmDelete(r)}
          >
            Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Class-subject assignments" description="Assign subjects to classes by academic year">
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
            label="Academic year"
            options={years.map((y) => ({ value: y.id, label: y.name }))}
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
          />
          <Select
            label="Class"
            options={classes.map((c) => ({ value: c.id, label: `${c.name} ${c.stream}` }))}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
        </div>
      </Card>

      <Card title={`Assigned subjects (${assignments.length})`}>
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            disabled={!academicYearId || !classId}
            onClick={() => {
              setSelectedSubjects([]);
              setAssignOpen(true);
            }}
          >
            Assign subjects
          </Button>
        </div>
        {!loading && assignments.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No subjects assigned for this class and year yet.
          </p>
        ) : (
          <Table columns={columns} rows={assignments as Row[]} loading={loading} searchKeys={["subjectName", "subjectCode"]} />
        )}
      </Card>

      <Modal open={assignOpen} title="Assign subjects" onClose={() => setAssignOpen(false)}>
        <p className="mb-3 text-sm text-muted-foreground">
          Select subjects for {selectedClass ? `${selectedClass.name} ${selectedClass.stream}` : "class"}.
        </p>
        <div className="max-h-80 space-y-2 overflow-auto rounded-md border border-border p-3">
          {filteredSubjects.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={selectedSubjects.includes(s.id)}
                onChange={(e) =>
                  setSelectedSubjects((prev) =>
                    e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id),
                  )
                }
              />
              {s.code} - {s.name}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={selectedSubjects.length === 0} onClick={() => void onBulkAssign()}>
            Assign selected
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(editing)} title="Edit teacher assignment" onClose={() => setEditing(null)}>
        <Select label="Teacher" options={teacherOptions} value={teacherId} onChange={(e) => setTeacherId(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button type="button" loading={Boolean(editing && busyId === editing.id)} onClick={() => void onSaveTeacher()}>
            Save
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Remove subject assignment?"
        description="This removes the subject from the selected class for this academic year."
        confirmLabel="Remove"
        danger
        loading={Boolean(confirmDelete && busyId === confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void onDelete()}
      />
    </PageWrapper>
  );
}
