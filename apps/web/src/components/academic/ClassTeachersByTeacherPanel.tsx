"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SchoolClass } from "@uganda-cbc-sms/shared";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { classDisplayName, filterClassesByLevel, levelShortLabel, type AcademicLevel } from "@/lib/academicLevel";
import { apiGet, apiPut } from "@/lib/api";

type ClassTeacherAssignment = {
  id: string;
  classId: string;
  className: string;
  classStream: string;
  teacherId: string;
  isHomeroom: boolean;
};

type TeacherClassAssignmentRow = {
  classId: string;
  className: string;
  classStream: string;
  isHomeroom: boolean;
};

type Row = TeacherClassAssignmentRow & Record<string, unknown>;

const REMOVE_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";

async function saveClassTeachers(
  classId: string,
  academicYearId: string,
  teachers: { teacherId: string; isHomeroom: boolean }[],
) {
  await apiPut(`/academic/classes/${encodeURIComponent(classId)}/teacher-assignments`, {
    academicYearId,
    teachers,
  });
}

export function ClassTeachersByTeacherPanel({
  teacherId,
  teacherName,
  academicYearId,
  level,
  classes,
  hrefWithLevel,
}: {
  teacherId: string;
  teacherName?: string;
  academicYearId: string;
  level: AcademicLevel;
  classes: SchoolClass[];
  hrefWithLevel: (path: string, extra?: Record<string, string>) => string;
}) {
  const [rows, setRows] = useState<TeacherClassAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyClassId, setBusyClassId] = useState<string | null>(null);
  const [addClassId, setAddClassId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const levelClasses = useMemo(
    () => filterClassesByLevel(classes, level, academicYearId),
    [classes, level, academicYearId],
  );

  const assignedClassIds = useMemo(() => new Set(rows.map((r) => r.classId)), [rows]);

  const addableClasses = useMemo(
    () => levelClasses.filter((c) => !assignedClassIds.has(c.id)),
    [levelClasses, assignedClassIds],
  );

  const load = async () => {
    if (!teacherId || !academicYearId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams({ academicYearId, level, teacherId });
      const data = await apiGet<ClassTeacherAssignment[]>(
        `/academic/class-teacher-assignments?${q.toString()}`,
      );
      setRows(
        data.map((a) => ({
          classId: a.classId,
          className: a.className,
          classStream: a.classStream,
          isHomeroom: a.isHomeroom,
        })),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load class assignments");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, academicYearId, level]);

  const loadClassRoster = async (classId: string) => {
    const current = await apiGet<ClassTeacherAssignment[]>(
      `/academic/class-teacher-assignments?classId=${encodeURIComponent(classId)}&academicYearId=${encodeURIComponent(academicYearId)}`,
    );
    return current.map((a) => ({
      teacherId: a.teacherId,
      isHomeroom: a.isHomeroom,
    }));
  };

  const onAddToClass = async () => {
    if (!addClassId) return;
    setBusyClassId(addClassId);
    setErr(null);
    setOk(null);
    try {
      const roster = await loadClassRoster(addClassId);
      if (!roster.some((t) => t.teacherId === teacherId)) {
        roster.push({ teacherId, isHomeroom: false });
      }
      await saveClassTeachers(addClassId, academicYearId, roster);
      setAddClassId("");
      setOk("Added to class.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add to class");
    } finally {
      setBusyClassId(null);
    }
  };

  const onRemoveFromClass = async (classId: string) => {
    setBusyClassId(classId);
    setErr(null);
    setOk(null);
    try {
      const roster = (await loadClassRoster(classId)).filter((t) => t.teacherId !== teacherId);
      await saveClassTeachers(classId, academicYearId, roster);
      setOk("Removed from class.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to remove from class");
    } finally {
      setBusyClassId(null);
    }
  };

  const onSetHomeroom = async (classId: string) => {
    setBusyClassId(classId);
    setErr(null);
    setOk(null);
    try {
      const roster = await loadClassRoster(classId);
      const updated = roster.map((t) => ({
        teacherId: t.teacherId,
        isHomeroom: t.teacherId === teacherId,
      }));
      if (!updated.some((t) => t.teacherId === teacherId)) {
        updated.push({ teacherId, isHomeroom: true });
      }
      await saveClassTeachers(classId, academicYearId, updated);
      setOk("Homeroom updated.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to set homeroom");
    } finally {
      setBusyClassId(null);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "className",
      header: "Class",
      render: (r) => classDisplayName({ name: r.className, stream: r.classStream }),
    },
    {
      key: "isHomeroom",
      header: "Role",
      render: (r) => (r.isHomeroom ? "Homeroom head" : "Class teacher"),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap justify-end gap-2">
          {!r.isHomeroom ? (
            <button
              type="button"
              className={REMOVE_BTN}
              disabled={busyClassId === r.classId}
              onClick={() => void onSetHomeroom(r.classId)}
            >
              Set homeroom
            </button>
          ) : null}
          <Link
            href={hrefWithLevel("/admin/academic/class-teachers", {
              classId: r.classId,
              academicYearId,
            })}
            className="text-xs font-medium text-brand hover:underline"
          >
            Edit class
          </Link>
          <button
            type="button"
            className={REMOVE_BTN}
            disabled={busyClassId === r.classId}
            onClick={() => void onRemoveFromClass(r.classId)}
          >
            Remove
          </button>
        </div>
      ),
    },
  ];

  if (!teacherId) {
    return <p className="text-sm text-muted-foreground">Select a teacher to manage their class assignments.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {teacherName ? (
          <>
            <span className="font-medium text-foreground">{teacherName}</span> — {levelShortLabel(level)} classes for
            this year. Homeroom is the class head for reports; other rows are supporting class teachers.
          </>
        ) : (
          <>Manage {levelShortLabel(level)} class assignments for the selected teacher.</>
        )}
      </p>
      {err ? <Alert tone="error">{err}</Alert> : null}
      {ok ? <Alert tone="success">{ok}</Alert> : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Select
            label={`Add to ${levelShortLabel(level)} class`}
            options={[
              { value: "", label: addableClasses.length ? "— Select class —" : "— No more classes —" },
              ...addableClasses.map((c) => ({ value: c.id, label: classDisplayName(c) })),
            ]}
            value={addClassId}
            disabled={addableClasses.length === 0 || Boolean(busyClassId)}
            onChange={(e) => setAddClassId(e.target.value)}
          />
        </div>
        <Button
          type="button"
          disabled={!addClassId || Boolean(busyClassId)}
          onClick={() => void onAddToClass()}
        >
          Add to class
        </Button>
      </div>

      {!loading && rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          Not assigned to any {levelShortLabel(level)} classes this year. Add a class above or use the By class tab.
        </p>
      ) : (
        <Table columns={columns} rows={rows as Row[]} loading={loading} pageSize={100} />
      )}
    </div>
  );
}
