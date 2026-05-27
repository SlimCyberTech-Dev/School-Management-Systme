"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileDown, GraduationCap } from "lucide-react";
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
import { classDisplayName } from "@/lib/academicLevel";
import { apiGet } from "@/lib/api";
import { manualStatus } from "@/lib/queryStatus";
import type { PaginatedStudents } from "@uganda-cbc-sms/shared";

type AttRow = { status?: string; student_name?: string; student_number?: string };

export default function ClassTeacherDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const scope = useMyTeachingScope();

  const homeroomClass = scope.homeroomClass;
  const previewSlot = scope.subjectSlots[0] ?? null;
  const loadAttendance = Boolean(homeroomClass?.classId);
  const loadSubjectRoster = Boolean(!homeroomClass && scope.primaryDashboardClassId);

  const studentsQ = useQuery({
    queryKey: ["class-teacher-dashboard-students", scope.primaryDashboardClassId],
    queryFn: () =>
      apiGet<PaginatedStudents>(
        `/students?classId=${encodeURIComponent(scope.primaryDashboardClassId!)}&status=active&limit=100&page=1&sort=name`,
      ),
    enabled: Boolean(scope.primaryDashboardClassId) && (loadAttendance || loadSubjectRoster),
  });

  const attendanceQ = useQuery({
    queryKey: ["attendance-today", homeroomClass?.classId, today],
    queryFn: () =>
      apiGet<AttRow[]>(
        `/attendance?classId=${encodeURIComponent(homeroomClass!.classId)}&date=${encodeURIComponent(today)}`,
      ),
    enabled: loadAttendance,
  });

  const students = studentsQ.data?.items ?? [];
  const att = attendanceQ.data ?? [];
  const absentees = att.filter((a) => a.status === "absent");

  const scopeReady = !scope.isLoading;
  const studentsPending = Boolean(scope.primaryDashboardClassId) && studentsQ.isPending;
  const attendancePending = loadAttendance && attendanceQ.isPending;

  const status = manualStatus({
    loading: !scopeReady || studentsPending || attendancePending,
    error: scope.error ?? studentsQ.error ?? attendanceQ.error,
    data: scope.hasAssignments ? scope.subjectSlots : scope.myClasses,
  });

  const isFetching =
    scope.isLoading || studentsQ.isFetching || (loadAttendance && attendanceQ.isFetching);

  const errorMessage =
    (scope.error ?? studentsQ.error ?? attendanceQ.error) instanceof Error
      ? (scope.error ?? studentsQ.error ?? attendanceQ.error)!.message
      : "Failed to load";

  const metrics = useMemo(
    () => [
      {
        label: "Homeroom class",
        value: homeroomClass ? scope.classLabel(homeroomClass) : "Not assigned",
        delta: homeroomClass ? scope.activeYear?.name ?? "This year" : "Subject-only link",
        deltaTone: homeroomClass ? ("positive" as const) : ("neutral" as const),
      },
      {
        label: "Learners",
        value: scope.primaryDashboardClassId ? String(students.length) : "—",
        delta: homeroomClass ? "Homeroom roster" : previewSlot ? "Assigned class" : "No class",
        deltaTone: "neutral" as const,
      },
      {
        label: "Subject slots",
        value: String(scope.subjectSlots.length),
        delta: scope.activeYear?.name ?? "This year",
        deltaTone: scope.subjectSlots.length > 0 ? ("positive" as const) : ("neutral" as const),
      },
      {
        label: "Absentees today",
        value: homeroomClass ? String(absentees.length) : "—",
        delta: homeroomClass
          ? absentees.length > 0
            ? "Follow up"
            : "No issues"
          : "Homeroom only",
        deltaTone: homeroomClass
          ? absentees.length > 0
            ? ("negative" as const)
            : ("positive" as const)
          : ("neutral" as const),
      },
    ],
    [homeroomClass, scope, students.length, absentees.length, previewSlot],
  );

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Class Teacher Dashboard"
        description="Homeroom class, attendance, and your assigned teaching slots for this year."
      />
      <AsyncContent
        status={status}
        isFetching={isFetching}
        loading={<DashboardSkeleton />}
        error={
          <ErrorState message={errorMessage} onRetry={() => void scope.refetch()} />
        }
      >
        <KpiGrid metrics={metrics} />
        <DashboardTwoColumn
          primary={
            homeroomClass ? (
              <DashboardPanel title={`Attendance today (${today})`}>
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
                          Student
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {att.length ? (
                        att.map((row, index) => {
                          const isAbsent = row.status === "absent";
                          return (
                            <tr
                              key={`${row.student_number}-${index}`}
                              className="transition-ui border-t border-border/50 hover:bg-muted/40 dark:hover:bg-muted/30"
                            >
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                                {row.student_name ?? "Unknown"} ({row.student_number ?? "N/A"})
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                    isAbsent
                                      ? "bg-red-500/10 text-red-700 dark:text-red-400"
                                      : "bg-green-500/10 text-green-700 dark:text-green-400"
                                  }`}
                                >
                                  {isAbsent ? "Absent" : "Present"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-0">
                            <EmptyState
                              title="No attendance recorded today"
                              description="Mark today's register to track absentees."
                              icon={ClipboardList}
                              action={{ label: "Open attendance", href: "/class-teacher/attendance" }}
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardPanel>
            ) : previewSlot ? (
              <DashboardPanel
                title={`${previewSlot.subjectCode} — ${classDisplayName({ name: previewSlot.className, stream: previewSlot.classStream })}`}
              >
                <p className="mb-4 text-sm text-muted-foreground">
                  You are assigned to teach this subject. Homeroom attendance and class-head duties require a separate
                  assignment as <strong>class head</strong> on Class teachers.
                </p>
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
                        students.slice(0, 10).map((s) => (
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
                {students.length > 10 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing 10 of {students.length} learners.{" "}
                    <Link href="/class-teacher/students" className="font-medium text-brand hover:underline">
                      View full class list
                    </Link>
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link
                    href="/class-teacher/assessment/alevel"
                    className="font-medium text-brand hover:underline"
                  >
                    A-Level assessment →
                  </Link>
                  <Link href="/class-teacher/exams" className="font-medium text-brand hover:underline">
                    Exams →
                  </Link>
                </div>
              </DashboardPanel>
            ) : (
              <DashboardPanel title="Your classes">
                <EmptyState
                  title="No assignments yet"
                  description="Ask your administrator to assign you on Class teachers (homeroom) or Subject teachers (timetable slots)."
                />
              </DashboardPanel>
            )
          }
          secondary={
            <div className="space-y-4">
              <TeacherTeachingScopeCard
                myClasses={scope.myClasses}
                subjectSlots={scope.subjectSlots}
                homeroomClasses={scope.homeroomClasses}
                academicYearName={scope.activeYear?.name}
              />
              <DashboardPanel title="Quick links">
                <div className="space-y-2 text-sm">
                  {homeroomClass ? (
                    <>
                      <Link
                        className="block text-blue-600 hover:underline dark:text-blue-400"
                        href="/class-teacher/attendance"
                      >
                        Open attendance register
                      </Link>
                      <Link
                        className="block text-blue-600 hover:underline dark:text-blue-400"
                        href="/class-teacher/students"
                      >
                        View class list
                      </Link>
                      <Link
                        className="block text-blue-600 hover:underline dark:text-blue-400"
                        href="/class-teacher/comments"
                      >
                        Complete report comments
                      </Link>
                    </>
                  ) : previewSlot ? (
                    <>
                      <Link
                        className="block text-blue-600 hover:underline dark:text-blue-400"
                        href="/class-teacher/students"
                      >
                        View learners
                      </Link>
                      <Link
                        className="block text-blue-600 hover:underline dark:text-blue-400"
                        href="/class-teacher/assessment/alevel"
                      >
                        A-Level assessment
                      </Link>
                      <Link
                        className="block text-blue-600 hover:underline dark:text-blue-400"
                        href="/class-teacher/exams"
                      >
                        Exams
                      </Link>
                    </>
                  ) : null}
                </div>
              </DashboardPanel>
            </div>
          }
        />
      </AsyncContent>
    </div>
  );
}
