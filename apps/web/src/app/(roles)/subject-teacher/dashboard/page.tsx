"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, GraduationCap } from "lucide-react";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import {
  DashboardHeader,
  DashboardPanel,
  DashboardSkeleton,
  DashboardTwoColumn,
  KpiGrid,
} from "@/components/layout/shells/DashboardScaffold";
import { TeacherTeachingScopeCard } from "@/components/teaching/TeacherTeachingScopeCard";
import { useMyTeachingScope } from "@/hooks/useMyTeachingScope";
import { apiGet } from "@/lib/api";
import { manualStatus } from "@/lib/queryStatus";
import type { PaginatedStudents } from "@uganda-cbc-sms/shared";

type CbcRow = { submitted?: boolean; id: string };

export default function SubjectTeacherDashboardPage() {
  const scope = useMyTeachingScope();
  const previewClassId = scope.primarySubjectClassId;

  const studentsQ = useQuery({
    queryKey: ["subject-teacher-dashboard-students", previewClassId],
    queryFn: () =>
      apiGet<PaginatedStudents>(
        `/students?classId=${encodeURIComponent(previewClassId!)}&status=active&limit=10&page=1&sort=name`,
      ),
    enabled: Boolean(previewClassId),
  });

  const cbcQ = useQuery({
    queryKey: ["cbc-dashboard", scope.yearId, scope.termId],
    queryFn: async () => {
      if (!scope.yearId || !scope.termId) {
        return [] as CbcRow[];
      }
      return apiGet<CbcRow[]>(
        `/assessments/cbc?termId=${encodeURIComponent(scope.termId)}&yearId=${encodeURIComponent(scope.yearId)}`,
      );
    },
    enabled: Boolean(scope.yearId && scope.termId && scope.subjectSlots.length > 0),
  });

  const cbcRows = cbcQ.data ?? [];
  const submitted = cbcRows.filter((r) => r.submitted).length;
  const pending = cbcRows.length - submitted;

  const uniqueClasses = useMemo(() => {
    const ids = new Set(scope.subjectSlots.map((s) => s.classId));
    return ids.size;
  }, [scope.subjectSlots]);

  const previewSlot = scope.subjectSlots[0] ?? null;
  const students = studentsQ.data?.items ?? [];

  const loadStudents = Boolean(previewClassId);
  const loadCbc = Boolean(scope.yearId && scope.termId && scope.subjectSlots.length > 0);

  const status = manualStatus({
    loading:
      scope.isLoading || (loadStudents && studentsQ.isPending) || (loadCbc && cbcQ.isPending),
    error: scope.error ?? studentsQ.error ?? cbcQ.error,
    data: scope.hasAssignments ? scope.subjectSlots : scope.myClasses,
  });

  const isFetching =
    scope.isLoading ||
    (loadStudents && studentsQ.isFetching) ||
    (loadCbc && cbcQ.isFetching);
  const errorMessage =
    (scope.error ?? studentsQ.error ?? cbcQ.error) instanceof Error
      ? (scope.error ?? studentsQ.error ?? cbcQ.error)!.message
      : "Failed to load";

  const metrics = useMemo(
    () => [
      {
        label: "Subject slots",
        value: String(scope.subjectSlots.length),
        delta: scope.activeYear?.name ?? "This year",
        deltaTone: scope.subjectSlots.length > 0 ? ("positive" as const) : ("negative" as const),
      },
      {
        label: "Classes",
        value: String(uniqueClasses),
        delta: "With assigned subjects",
        deltaTone: "neutral" as const,
      },
      {
        label: "CBC rows (term)",
        value: scope.subjectSlots.length > 0 ? String(cbcRows.length) : "—",
        delta: `${submitted} submitted · ${pending} pending`,
        deltaTone: pending > 0 ? ("negative" as const) : ("positive" as const),
      },
      {
        label: "Active term",
        value: scope.termId ? `Term ${scope.activeTerm?.termNumber ?? ""}` : "Not set",
        delta: scope.termId ? "Ready" : "Missing",
        deltaTone: scope.termId ? ("positive" as const) : ("negative" as const),
      },
    ],
    [scope, uniqueClasses, cbcRows.length, submitted, pending],
  );

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Subject Teacher Dashboard"
        description="Your assigned class–subject slots drive marking, exams, and assessments."
      />
      <AsyncContent
        status={status}
        isFetching={isFetching}
        loading={<DashboardSkeleton />}
        error={<ErrorState message={errorMessage} onRetry={() => void scope.refetch()} />}
      >
        <KpiGrid metrics={metrics} />
        <DashboardTwoColumn
          primary={
            <DashboardPanel
              title={
                previewSlot
                  ? `Learners — ${previewSlot.className} ${previewSlot.classStream} (${previewSlot.subjectCode})`
                  : "Learners"
              }
            >
              {scope.subjectSlots.length === 0 ? (
                <EmptyState
                  title="No subject assignments"
                  description="Ask the administrator to assign you to class–subject slots on Subject teachers."
                  icon={GraduationCap}
                />
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-end">
                    <button
                      type="button"
                      className="transition-ui inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50"
                    >
                      <FileDown className="h-4 w-4 stroke-[1.5]" />
                      Export
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Learner
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Student #
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length ? (
                          students.map((s) => (
                            <tr
                              key={s.id}
                              className="transition-ui border-t border-border/50 hover:bg-muted/40 dark:hover:bg-muted/30"
                            >
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{s.fullName}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-muted-foreground">
                                {s.studentNumber}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="p-0">
                              <EmptyState
                                title="No learners in this class"
                                description="Students appear when enrolled in the assigned class."
                                icon={GraduationCap}
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {studentsQ.data && studentsQ.data.total > students.length ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Showing {students.length} of {studentsQ.data.total} learners in this class.
                    </p>
                  ) : null}
                </>
              )}
            </DashboardPanel>
          }
          secondary={
            <div className="space-y-4">
              <TeacherTeachingScopeCard
                myClasses={scope.myClasses}
                subjectSlots={scope.subjectSlots}
                homeroomClasses={scope.homeroomClasses}
                academicYearName={scope.activeYear?.name}
              />
              <DashboardPanel title="Assessment shortcuts">
                <div className="space-y-2 text-sm">
                  <Link
                    className="block text-blue-600 hover:underline dark:text-blue-400"
                    href="/subject-teacher/exams"
                  >
                    Open exams (formal marking)
                  </Link>
                  <Link
                    className="block text-blue-600 hover:underline dark:text-blue-400"
                    href="/subject-teacher/assessment/cbc"
                  >
                    CBC assessment (term competencies)
                  </Link>
                  <Link
                    className="block text-blue-600 hover:underline dark:text-blue-400"
                    href="/subject-teacher/assessment/alevel"
                  >
                    A-Level assessment (term scores)
                  </Link>
                </div>
              </DashboardPanel>
            </div>
          }
        />
      </AsyncContent>
    </div>
  );
}
