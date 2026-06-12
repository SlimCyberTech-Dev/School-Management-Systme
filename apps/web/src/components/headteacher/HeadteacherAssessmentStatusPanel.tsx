"use client";

import type { AcademicYear, SchoolClass, Term } from "@uganda-cbc-sms/shared";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AssessmentStatusOverview } from "@/components/assessment/AssessmentStatusOverview";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TableSkeleton } from "@/components/feedback/TableSkeleton";
import { HeadteacherPeriodFilters, type HeadteacherPeriodValue } from "@/components/headteacher/HeadteacherPeriodFilters";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { apiGet, getApiErrorMessage } from "@/lib/api";
import { queryStatus } from "@/lib/queryStatus";

type StatusRow = {
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string | null;
  status?: string;
};

type Props = {
  track: "cbc" | "alevel";
  title: string;
  description: string;
  statusPath: "/assessments/cbc/status" | "/assessments/alevel/status";
  canUnlock?: boolean;
  onUnlock?: (subjectId: string, filters: HeadteacherPeriodValue) => Promise<void>;
};

export function HeadteacherAssessmentStatusPanel({
  track,
  title,
  description,
  statusPath,
  canUnlock,
  onUnlock,
}: Props) {
  const [filters, setFilters] = useState<HeadteacherPeriodValue>({
    yearId: "",
    termId: "",
    classId: "",
  });
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string }>({});

  const yearsQ = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => apiGet<AcademicYear[]>("/academic/years"),
  });
  const termsQ = useQuery({
    queryKey: ["academic-terms", filters.yearId],
    queryFn: () => apiGet<Term[]>(`/academic/terms?academicYearId=${encodeURIComponent(filters.yearId)}`),
    enabled: Boolean(filters.yearId),
  });
  const classesQ = useQuery({
    queryKey: ["academic-classes"],
    queryFn: () => apiGet<SchoolClass[]>("/academic/classes"),
  });

  const years = useMemo(() => yearsQ.data ?? [], [yearsQ.data]);
  const terms = useMemo(() => termsQ.data ?? [], [termsQ.data]);
  const classes = useMemo(
    () => (classesQ.data ?? []).filter((c) => !filters.yearId || c.academicYearId === filters.yearId),
    [classesQ.data, filters.yearId],
  );

  useEffect(() => {
    if (!filters.yearId && years.length) {
      const active = years.find((y) => y.isActive) ?? years[0];
      if (active) setFilters((f) => ({ ...f, yearId: active.id }));
    }
  }, [years, filters.yearId]);

  useEffect(() => {
    if (!filters.termId && terms.length) {
      const active = terms.find((t) => t.isActive) ?? terms[0];
      if (active) setFilters((f) => ({ ...f, termId: active.id }));
    }
  }, [terms, filters.termId]);

  useEffect(() => {
    if (!filters.classId && classes.length) {
      setFilters((f) => ({ ...f, classId: classes[0]!.id }));
    }
  }, [classes, filters.classId]);

  const ready = Boolean(filters.yearId && filters.termId && filters.classId);
  const statusQ = useQuery({
    queryKey: [`${track}-status`, filters],
    queryFn: () => {
      const qp = new URLSearchParams({
        classId: filters.classId,
        termId: filters.termId,
        yearId: filters.yearId,
      });
      return apiGet<StatusRow[]>(`${statusPath}?${qp}`);
    },
    enabled: ready,
  });

  const rows = statusQ.data ?? [];
  const submitted = rows.filter((r) => r.status === "Submitted").length;
  const draft = rows.filter((r) => r.status !== "Submitted").length;

  const handleUnlock = async (subjectId: string) => {
    if (!onUnlock) return;
    setFeedback({});
    try {
      await onUnlock(subjectId, filters);
      setFeedback({ ok: "Subject assessment unlocked for teacher edits." });
      await statusQ.refetch();
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card title="Filters">
        <HeadteacherPeriodFilters
          years={years}
          terms={terms}
          classes={classes}
          value={filters}
          onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
        />
      </Card>

      {ready ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subjects</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Submitted</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {submitted}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">In progress</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">{draft}</p>
          </div>
        </div>
      ) : null}

      {feedback.ok ? <Alert tone="success">{feedback.ok}</Alert> : null}
      {feedback.err ? <Alert tone="error">{feedback.err}</Alert> : null}

      <Card title="Subject submission status">
        <AsyncContent
          status={ready ? queryStatus(statusQ) : "success"}
          loading={<TableSkeleton rows={5} cols={4} />}
          error={
            <ErrorState
              message={statusQ.error instanceof Error ? statusQ.error.message : "Could not load status"}
              onRetry={() => void statusQ.refetch()}
            />
          }
        >
          {!ready ? (
            <p className="text-sm text-muted-foreground">Select academic year, term, and class to view progress.</p>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No subjects assigned"
              description="Assign subjects to this class under Academic setup before teachers can enter marks."
            />
          ) : (
            <AssessmentStatusOverview
              rows={rows}
              canUnlock={canUnlock}
              onUnlock={canUnlock ? (subjectId) => handleUnlock(subjectId) : undefined}
            />
          )}
        </AsyncContent>
      </Card>
    </div>
  );
}
