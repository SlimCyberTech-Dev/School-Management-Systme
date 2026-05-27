"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AcademicYear, SchoolClass } from "@uganda-cbc-sms/shared";
import { AcademicLevelScope } from "@/components/academic/AcademicLevelScope";
import { ClassTeachersByTeacherPanel } from "@/components/academic/ClassTeachersByTeacherPanel";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { useTeachingStaff } from "@/hooks/useTeachingStaff";
import { useAcademicLevelScope } from "@/hooks/useAcademicLevelScope";
import {
  classDisplayName,
  filterClassesByLevel,
  levelShortLabel,
} from "@/lib/academicLevel";
import { apiGet, apiPut } from "@/lib/api";

type ClassTeacherAssignment = {
  id: string;
  classId: string;
  className: string;
  classStream: string;
  teacherId: string;
  teacherName: string;
  teacherRole: string;
  academicYearId: string;
  academicYearName: string;
  isHomeroom: boolean;
};

type Row = ClassTeacherAssignment & Record<string, unknown>;

const CHECK =
  "h-4 w-4 rounded border-border text-foreground accent-brand disabled:cursor-not-allowed disabled:opacity-50";

type ViewMode = "class" | "teacher";

export default function AdminClassTeachersPage() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("classId") ?? "";
  const initialYearId = searchParams.get("academicYearId") ?? "";
  const initialTeacherId = searchParams.get("teacherId") ?? "";
  const initialView = searchParams.get("view") === "teacher" ? "teacher" : "class";
  const { level, setLevel, hrefWithLevel } = useAcademicLevelScope("O_LEVEL");
  const { staff, options: teacherOptions, loading: staffLoading } = useTeachingStaff();
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState(initialTeacherId);
  const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [homeroomTeacherId, setHomeroomTeacherId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const classOptions = useMemo(() => {
    const filtered = filterClassesByLevel(
      academicYearId ? classes.filter((c) => c.academicYearId === academicYearId) : classes,
      level,
    );
    return filtered.map((c) => ({ value: c.id, label: classDisplayName(c) }));
  }, [classes, academicYearId, level]);

  const selectedTeacher = useMemo(
    () => staff.find((t) => t.id === teacherId) ?? null,
    [staff, teacherId],
  );

  const classTeacherStaff = useMemo(
    () => staff.filter((t) => ["class_teacher", "subject_teacher", "headteacher"].includes(t.role)),
    [staff],
  );

  useEffect(() => {
    if (classId && !classOptions.some((o) => o.value === classId)) {
      setClassId(classOptions[0]?.value ?? "");
    }
  }, [classId, classOptions]);

  const loadMeta = async () => {
    const [y, c] = await Promise.all([
      apiGet<AcademicYear[]>("/academic/years"),
      apiGet<SchoolClass[]>("/academic/classes"),
    ]);
    setYears(y);
    setClasses(c);
    const yearId = academicYearId || initialYearId || y[0]?.id || "";
    if (yearId && yearId !== academicYearId) setAcademicYearId(yearId);
    const yearClasses = filterClassesByLevel(
      yearId ? c.filter((x) => x.academicYearId === yearId) : c,
      level,
    );
    const pickClass =
      (initialClassId && yearClasses.find((x) => x.id === initialClassId)) ||
      yearClasses[0];
    if (pickClass && !classId) setClassId(pickClass.id);
    if (initialTeacherId && !teacherId) setTeacherId(initialTeacherId);
    else if (!teacherId && classTeacherStaff[0]) setTeacherId(classTeacherStaff[0].id);
  };

  const loadAssignments = async (yId: string, cId: string) => {
    if (!yId || !cId) {
      setAssignments([]);
      return;
    }
    const rows = await apiGet<ClassTeacherAssignment[]>(
      `/academic/class-teacher-assignments?academicYearId=${encodeURIComponent(yId)}&classId=${encodeURIComponent(cId)}`,
    );
    setAssignments(rows);
    setSelectedTeacherIds(rows.map((r) => r.teacherId));
    setHomeroomTeacherId(rows.find((r) => r.isHomeroom)?.teacherId ?? "");
  };

  useEffect(() => {
    void (async () => {
      try {
        await loadMeta();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewMode !== "class" || !academicYearId || !classId) return;
    void loadAssignments(academicYearId, classId).catch((e) => {
      setErr(e instanceof Error ? e.message : "Failed to load assignments");
    });
  }, [academicYearId, classId, viewMode]);

  useEffect(() => {
    if (staffLoading || loading) return;
    void loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const onSave = async () => {
    if (!classId || !academicYearId) return;
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const teachers = selectedTeacherIds.map((id) => ({
        teacherId: id,
        isHomeroom: id === homeroomTeacherId,
      }));
      await apiPut(`/academic/classes/${encodeURIComponent(classId)}/teacher-assignments`, {
        academicYearId,
        teachers,
      });
      await loadAssignments(academicYearId, classId);
      setOk("Class teachers saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "teacherName",
      header: "Teacher",
      render: (r) => `${r.teacherName} (${r.teacherRole.replace(/_/g, " ")})`,
    },
    {
      key: "isHomeroom",
      header: "Homeroom head",
      render: (r) => (r.isHomeroom ? "Yes" : "—"),
    },
  ];

  return (
    <PageWrapper
      title="Class teachers"
      description={`Single place to assign homeroom and class teachers for ${levelShortLabel(level)} and A-Level`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <Link
          href={hrefWithLevel("/admin/academic/assignments", { academicYearId })}
          className="text-sm font-medium text-brand hover:underline"
        >
          ← Teaching assignments
        </Link>
        <Link href="/admin/academic" className="text-sm text-muted-foreground hover:text-foreground">
          Academic hub
        </Link>
      </div>
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>

      <div className="mb-4">
        <Card title="School level">
          <AcademicLevelScope
            level={level}
            onLevelChange={setLevel}
            description={`Only ${levelShortLabel(level)} classes appear below. Switch level for the other track.`}
          />
        </Card>
      </div>

      <Card title="How to assign">
        <p className="text-sm text-muted-foreground">
          This is the only page for class teacher assignment. Use <strong>By class</strong> to set all teachers on one
          class, or <strong>By teacher</strong> to see every class a staff member leads. Subject teaching slots are on{" "}
          <Link
            href={hrefWithLevel("/admin/academic/teacher-assignments", { academicYearId })}
            className="font-medium text-brand hover:underline"
          >
            Subject teachers
          </Link>
          . Do not set homeroom on the Classes page — it is managed here.
        </p>
        <div className="mt-3 inline-flex rounded-lg border border-border bg-muted/40 p-1" role="tablist">
          {(
            [
              { id: "class" as const, label: "By class" },
              { id: "teacher" as const, label: "By teacher" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={viewMode === tab.id}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-ui ${
                viewMode === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-4">
      <Card title="Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Academic year"
            options={years.map((y) => ({ value: y.id, label: y.name }))}
            value={academicYearId}
            onChange={(e) => {
              setAcademicYearId(e.target.value);
              setClassId("");
            }}
          />
          {viewMode === "class" ? (
            <Select
              label="Class"
              options={classOptions}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />
          ) : (
            <Select
              label="Teacher"
              options={teacherOptions}
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            />
          )}
        </div>
        {viewMode === "class" && classOptions.length === 0 && academicYearId ? (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            No {levelShortLabel(level)} classes for this year.{" "}
            <Link href={hrefWithLevel("/admin/academic/classes")} className="font-medium text-brand hover:underline">
              Create classes
            </Link>
            .
          </p>
        ) : null}
      </Card>
      </div>

      {viewMode === "teacher" ? (
        <div className="mt-4">
          <Card title={`${levelShortLabel(level)} classes for teacher`}>
            <ClassTeachersByTeacherPanel
              teacherId={teacherId}
              teacherName={selectedTeacher?.fullName}
              academicYearId={academicYearId}
              level={level}
              classes={classes}
              hrefWithLevel={hrefWithLevel}
            />
          </Card>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <Card title="Assign teachers to class">
              {staffLoading || loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : !classId ? (
                <p className="text-sm text-muted-foreground">Select a class.</p>
              ) : (
                <>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Pick all teachers attached to this class. Exactly one homeroom head leads reports and class
                    leadership.
                  </p>
                  <div className="mb-4 max-h-64 space-y-2 overflow-auto rounded-md border border-border p-3">
                    {classTeacherStaff.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className={CHECK}
                          checked={selectedTeacherIds.includes(t.id)}
                          onChange={(e) =>
                            setSelectedTeacherIds((prev) =>
                              e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                            )
                          }
                        />
                        {t.fullName} ({t.role.replace(/_/g, " ")})
                      </label>
                    ))}
                  </div>
                  <Select
                    label="Homeroom (class head)"
                    options={[
                      { value: "", label: "— None —" },
                      ...selectedTeacherIds
                        .map((id) => classTeacherStaff.find((t) => t.id === id))
                        .filter(Boolean)
                        .map((t) => ({ value: t!.id, label: t!.fullName })),
                    ]}
                    value={homeroomTeacherId}
                    onChange={(e) => setHomeroomTeacherId(e.target.value)}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button type="button" loading={saving} onClick={() => void onSave()}>
                      Save class teachers
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>

          <div className="mt-4">
            <Card title={`Current assignments (${assignments.length})`}>
              <Table columns={columns} rows={assignments as Row[]} loading={loading} pageSize={100} />
            </Card>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
