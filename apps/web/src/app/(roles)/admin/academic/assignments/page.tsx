"use client";

import { useEffect, useMemo, useState } from "react";
import type { AcademicYear, SchoolClass, Term, TimetableTemplate, TimetableTemplateOverview } from "@uganda-cbc-sms/shared";
import { AcademicLevelScope } from "@/components/academic/AcademicLevelScope";
import { TeachingAssignmentSteps } from "@/components/academic/TeachingAssignmentSteps";
import { TeachingAssignmentsOverview } from "@/components/academic/TeachingAssignmentsOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useAcademicLevelScope } from "@/hooks/useAcademicLevelScope";
import { levelLabel } from "@/lib/academicLevel";
import { apiGet } from "@/lib/api";

export default function AdminTeachingAssignmentsPage() {
  const { level, setLevel, hrefWithLevel, academicBasePath } = useAcademicLevelScope("O_LEVEL");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [yearId, setYearId] = useState("");
  const [classSubjects, setClassSubjects] = useState<
    Array<{ id: string; classId: string; teacherId: string | null }>
  >([]);
  const [classTeachers, setClassTeachers] = useState<
    Array<{ classId: string; isHomeroom: boolean; teacherName: string }>
  >([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState("");
  const [hasPublishedTimetable, setHasPublishedTimetable] = useState(false);
  const [lessonCountByClassId, setLessonCountByClassId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const y = await apiGet<AcademicYear[]>("/academic/years");
        setYears(y);
        const active = y.find((x) => x.isActive) ?? y[0];
        if (active) setYearId(active.id);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load academic years");
      }
    })();
  }, []);

  useEffect(() => {
    if (!yearId) return;
    void (async () => {
      try {
        const t = await apiGet<Term[]>(`/academic/terms?academicYearId=${encodeURIComponent(yearId)}`);
        setTerms(t);
        const active = t.find((x) => x.isActive) ?? t[0];
        setTermId(active?.id ?? "");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load terms");
      }
    })();
  }, [yearId]);

  useEffect(() => {
    if (!yearId) return;
    void (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [c, cs, ct] = await Promise.all([
          apiGet<SchoolClass[]>("/academic/classes"),
          apiGet<
            Array<{ id: string; classId: string; teacherId: string | null; academicYearId?: string }>
          >(`/academic/class-subjects?academicYearId=${encodeURIComponent(yearId)}`),
          apiGet<
            Array<{ classId: string; isHomeroom: boolean; teacherName: string }>
          >(
            `/academic/class-teacher-assignments?academicYearId=${encodeURIComponent(yearId)}`,
          ),
        ]);
        setClasses(c);
        setClassSubjects(cs);
        setClassTeachers(ct);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load assignment overview");
      } finally {
        setLoading(false);
      }
    })();
  }, [yearId]);

  useEffect(() => {
    if (!yearId || !termId) {
      setHasPublishedTimetable(false);
      setLessonCountByClassId({});
      return;
    }
    void (async () => {
      try {
        const qp = new URLSearchParams({
          academicYearId: yearId,
          termId,
          level,
        });
        const templates = await apiGet<TimetableTemplate[]>(`/timetable/templates?${qp.toString()}`);
        const published = templates.find((t) => t.status === "published");
        if (!published) {
          setHasPublishedTimetable(false);
          setLessonCountByClassId({});
          return;
        }
        const overview = await apiGet<TimetableTemplateOverview>(
          `/timetable/templates/${encodeURIComponent(published.id)}/overview`,
        );
        const counts: Record<string, number> = {};
        for (const row of overview.classes) {
          counts[row.classId] = row.lessonCount;
        }
        setLessonCountByClassId(counts);
        setHasPublishedTimetable(true);
      } catch {
        setHasPublishedTimetable(false);
        setLessonCountByClassId({});
      }
    })();
  }, [yearId, termId, level]);

  const termLabel = useMemo(() => {
    const term = terms.find((t) => t.id === termId);
    return term ? `Term ${term.termNumber}` : undefined;
  }, [terms, termId]);

  return (
    <PageWrapper
      title="Teaching assignments"
      description="Assign class teachers and subject teachers separately for O-Level (CBC) and A-Level (UNEB)"
    >
      <div className="space-y-6">
        {err ? <Alert tone="error">{err}</Alert> : null}

        <Card title="School level">
          <AcademicLevelScope
            level={level}
            onLevelChange={setLevel}
            description={`Everything below applies to ${levelLabel(level)} only. Switch level to configure the other track.`}
          />
        </Card>

        <Card title="Academic year">
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Year"
              options={years.map((y) => ({ value: y.id, label: y.name }))}
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
            />
            <Select
              label="Term (timetable readiness)"
              options={terms.map((t) => ({
                value: t.id,
                label: `Term ${t.termNumber}${t.isActive ? " · active" : ""}`,
              }))}
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              disabled={terms.length === 0}
            />
          </div>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Assignment workflow</h2>
          <TeachingAssignmentSteps
            level={level}
            yearId={yearId}
            hrefWithLevel={hrefWithLevel}
            academicBasePath={academicBasePath}
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading class overview…</p>
        ) : (
          <TeachingAssignmentsOverview
            level={level}
            yearId={yearId}
            years={years}
            classes={classes}
            classSubjects={classSubjects}
            classTeachers={classTeachers}
            hrefWithLevel={hrefWithLevel}
            academicBasePath={academicBasePath}
            termLabel={termLabel}
            hasPublishedTimetable={hasPublishedTimetable}
            lessonCountByClassId={lessonCountByClassId}
          />
        )}

        <Card title="Before you assign teachers">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Create {level === "A_LEVEL" ? "A-Level" : "O-Level"} classes and subjects under Academic →
              Classes / Subjects (each row must match the same level).
            </li>
            <li>
              On the <strong>Subject teachers</strong> page, set teachable subjects (O-Level and A-Level) and assign
              staff to each class–subject slot.
            </li>
            <li>
              <strong>Class teachers</strong> (step 1) — homeroom and class staffing only on the Class teachers page.
            </li>
            <li>
              <strong>Subject teachers</strong> (step 3) — teachable subjects and class–subject slots on one page.
            </li>
          </ul>
        </Card>
      </div>
    </PageWrapper>
  );
}
