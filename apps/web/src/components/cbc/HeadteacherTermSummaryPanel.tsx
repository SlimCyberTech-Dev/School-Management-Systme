"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CompetencyLevel, Student } from "@uganda-cbc-sms/shared";
import { CompetencyLevelBadge } from "@/components/cbc/CompetencyLevelBadge";
import { CompetencyLevelSelector } from "@/components/cbc/CompetencyLevelSelector";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { pickCompetencyLevel } from "@/lib/cbcCompetency";
import { getApiErrorMessage } from "@/lib/api";
import { useCbcAssessments } from "@/hooks/useCBCAssessment";
import { useCbcCompetencyMutations, useCbcTermSummary } from "@/hooks/useCbcCompetencyApi";
import {
  filterClassesByLevel,
  pickDefaultAcademicYear,
  pickDefaultTerm,
} from "@/lib/academicLevel";
import { apiGet } from "@/lib/api";
import { manualStatus } from "@/lib/queryStatus";
import type { SchoolClass } from "@uganda-cbc-sms/shared";

type SubjectAssignment = { subjectId: string; subjectName: string; subjectCode: string };

export function HeadteacherTermSummaryPanel({ allowOverride = true }: { allowOverride?: boolean }) {
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideLevel, setOverrideLevel] = useState<CompetencyLevel | "">("");
  const [justification, setJustification] = useState("");
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string }>({});

  const yearsQ = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => apiGet<{ id: string; name: string; isActive?: boolean }[]>("/academic/years"),
  });
  const termsQ = useQuery({
    queryKey: ["academic-terms", yearId],
    queryFn: () =>
      apiGet<{ id: string; academicYearId: string; termNumber: number; isActive?: boolean }[]>(
        `/academic/terms?academicYearId=${encodeURIComponent(yearId)}`,
      ),
    enabled: Boolean(yearId),
  });
  const classesQ = useQuery({
    queryKey: ["academic-classes"],
    queryFn: () => apiGet<SchoolClass[]>("/academic/classes"),
  });

  const years = yearsQ.data ?? [];
  const terms = termsQ.data ?? [];
  const classes = classesQ.data ?? [];

  useEffect(() => {
    if (years.length && !yearId) setYearId(pickDefaultAcademicYear(years));
  }, [years, yearId]);

  const oLevelClasses = useMemo(
    () => filterClassesByLevel(classes, "O_LEVEL", yearId),
    [classes, yearId],
  );

  useEffect(() => {
    if (oLevelClasses.length && (!classId || !oLevelClasses.some((c) => c.id === classId))) {
      setClassId(oLevelClasses[0]!.id);
    }
  }, [oLevelClasses, classId]);

  const yearTerms = useMemo(() => terms.filter((t) => t.academicYearId === yearId), [terms, yearId]);

  useEffect(() => {
    if (yearTerms.length && (!termId || !yearTerms.some((t) => t.id === termId))) {
      setTermId(pickDefaultTerm(yearTerms)?.id ?? "");
    }
  }, [yearTerms, termId]);

  const subjectsQ = useQuery({
    queryKey: ["ht-cbc-subjects", classId, yearId],
    queryFn: async () => {
      const rows = await apiGet<SubjectAssignment[]>(
        `/academic/class-subjects?classId=${encodeURIComponent(classId)}&academicYearId=${encodeURIComponent(yearId)}`,
      );
      return rows.filter((x, i, arr) => arr.findIndex((k) => k.subjectId === x.subjectId) === i);
    },
    enabled: Boolean(classId && yearId),
  });

  const subjects = subjectsQ.data ?? [];

  useEffect(() => {
    if (subjects.length && (!subjectId || !subjects.some((s) => s.subjectId === subjectId))) {
      setSubjectId(subjects[0]!.subjectId);
    }
  }, [subjects, subjectId]);

  const studentsQ = useQuery({
    queryKey: ["students", classId],
    queryFn: () => apiGet<Student[]>(`/students?classId=${encodeURIComponent(classId)}`),
    enabled: Boolean(classId),
  });

  const students = studentsQ.data ?? [];

  useEffect(() => {
    if (students.length && (!studentId || !students.some((s) => s.id === studentId))) {
      setStudentId(students[0]!.id);
    }
  }, [students, studentId]);

  const summaryQ = useCbcTermSummary({ studentId, subjectId, termId });
  const legacyQ = useCbcAssessments({ classId, subjectId, termId, yearId });
  const { overrideSummary } = useCbcCompetencyMutations();

  const status = manualStatus({
    loading: summaryQ.isLoading,
    error: summaryQ.error,
    data: summaryQ.data,
    isEmpty: (d) => Array.isArray(d) && d.length === 0,
  });

  const activityBreakdownAvailable = false;

  const openOverride = (id: string, current: CompetencyLevel) => {
    setOverrideId(id);
    setOverrideLevel(current);
    setJustification("");
    setFeedback({});
  };

  const submitOverride = async () => {
    if (!overrideId || !overrideLevel || !justification.trim()) return;
    setFeedback({});
    try {
      await overrideSummary.mutateAsync({
        id: overrideId,
        payload: { overriddenLevel: overrideLevel, overrideJustification: justification.trim() },
      });
      setOverrideId(null);
      setFeedback({ ok: "Term summary updated with headteacher override." });
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Review scope">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Academic year"
            options={years.map((y) => ({ value: y.id, label: y.name }))}
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
          />
          <Select
            label="Class"
            options={oLevelClasses.map((c) => ({
              value: c.id,
              label: c.stream ? `${c.name} · ${c.stream}` : c.name,
            }))}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
          <Select
            label="Term"
            options={yearTerms.map((t) => ({ value: t.id, label: `Term ${t.termNumber}` }))}
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
          />
          <Select
            label="Subject"
            options={subjects.map((s) => ({ value: s.subjectId, label: `${s.subjectCode} — ${s.subjectName}` }))}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          />
          <Select
            label="Student"
            options={students.map((s) => ({ value: s.id, label: s.fullName }))}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>
      </Card>

      {feedback.ok ? <Alert tone="success">{feedback.ok}</Alert> : null}
      {feedback.err ? <Alert tone="error">{feedback.err}</Alert> : null}

      <AsyncContent
        status={status}
        loading={<FormSkeleton fields={5} />}
        error={
          <ErrorState message="Could not load term competency summary." onRetry={() => void summaryQ.refetch()} />
        }
        empty={
          <EmptyState
            title="No term summary yet"
            description="Summaries appear after competency ratings exist for this student, subject, and term."
          />
        }
      >
        <div className="overflow-x-auto rounded border border-border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-3 py-2 text-left">Competency</th>
                <th className="px-3 py-2 text-left">Effective level</th>
                <th className="px-3 py-2 text-left">Auto-aggregated</th>
                <th className="px-3 py-2 text-left">Override</th>
                {allowOverride ? <th className="px-3 py-2 text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {(summaryQ.data ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">{row.competency_name ?? row.competency_id}</td>
                  <td className="px-3 py-2">
                    <CompetencyLevelBadge level={row.effective_level} overridden={row.is_teacher_override} />
                  </td>
                  <td className="px-3 py-2">
                    <CompetencyLevelBadge level={row.aggregated_level} size="sm" />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {row.is_teacher_override ? (
                      <span title={row.override_justification ?? undefined}>
                        Overridden by headteacher
                        {row.overridden_level ? (
                          <>
                            {" "}
                            → <CompetencyLevelBadge level={row.overridden_level} size="sm" overridden />
                          </>
                        ) : null}
                        {row.overridden_at
                          ? ` · ${new Date(row.overridden_at).toLocaleString()}`
                          : ""}
                        {row.overridden_by ? ` · ${row.overridden_by}` : ""}
                      </span>
                    ) : (
                      row.aggregation_method
                    )}
                  </td>
                  {allowOverride ? (
                    <td className="px-3 py-2 text-right">
                      <Button type="button" variant="secondary" onClick={() => openOverride(row.id, row.effective_level)}>
                        Override
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncContent>

      <Card title="Activity-level ratings (sanity check)">
        {!activityBreakdownAvailable ? (
          <Alert tone="info">
            <strong>API gap:</strong> No endpoint returns per-activity competency ratings for this student. Showing
            legacy strand rows from <code className="text-xs">GET /assessments/cbc</code> (term-level, not activity-linked).
          </Alert>
        ) : null}
        {(legacyQ.data as Record<string, unknown>[] | undefined)?.length ? (
          <div className="mt-3 overflow-x-auto rounded border border-border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-2 py-2 text-left">Strand</th>
                  <th className="px-2 py-2 text-left">Competency</th>
                  <th className="px-2 py-2 text-left">Level</th>
                </tr>
              </thead>
              <tbody>
                {(legacyQ.data as Record<string, unknown>[]).map((row, i) => {
                  const level = pickCompetencyLevel(row);
                  return (
                    <tr key={i} className="border-t border-border">
                      <td className="px-2 py-2">{String(row.strand ?? "—")}</td>
                      <td className="px-2 py-2">{String(row.competency ?? "—")}</td>
                      <td className="px-2 py-2">
                        {level ? (
                          <CompetencyLevelBadge level={level} size="sm" />
                        ) : (
                          <span className="text-muted-foreground">{String(row.rating ?? "—")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No legacy CBC rows for this selection.</p>
        )}
      </Card>

      <Modal open={allowOverride && overrideId !== null} title="Override term summary" onClose={() => setOverrideId(null)}>
        <p className="mb-3 text-sm text-muted-foreground">
          Provide a justification. The submit button stays disabled until the text is non-empty.
        </p>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-sm font-medium">Overridden level</p>
            <CompetencyLevelSelector value={overrideLevel} onChange={setOverrideLevel} />
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Justification</span>
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOverrideId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!justification.trim() || !overrideLevel}
              loading={overrideSummary.isPending}
              onClick={() => void submitOverride()}
            >
              Apply override
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
