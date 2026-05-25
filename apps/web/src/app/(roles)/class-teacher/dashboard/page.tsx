"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { ClipboardList, FileDown } from "lucide-react";
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
import { apiGet } from "@/lib/api";
import { combineQueryStatus } from "@/lib/queryStatus";
import { useAuthStore } from "@/store/authStore";

type ClassRow = { id: string; name: string; stream?: string; classTeacherId?: string | null };
type StudentRow = { id: string; fullName: string; studentNumber: string; classId?: string | null };
type AttRow = { status?: string; student_name?: string; student_number?: string };

export default function ClassTeacherDashboardPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const today = new Date().toISOString().slice(0, 10);

  const [classesQ, studentsQ, attendanceQ] = useQueries({
    queries: [
      { queryKey: ["classes"], queryFn: () => apiGet<ClassRow[]>("/academic/classes"), enabled: Boolean(userId) },
      { queryKey: ["students"], queryFn: () => apiGet<StudentRow[]>("/students"), enabled: Boolean(userId) },
      {
        queryKey: ["attendance-today", userId, today],
        queryFn: async () => {
          const classes = await apiGet<ClassRow[]>("/academic/classes");
          const mine = classes.find((c) => c.classTeacherId === userId) ?? null;
          if (!mine) return { att: [] as AttRow[], myClass: null as ClassRow | null };
          const att = await apiGet<AttRow[]>(
            `/attendance?classId=${encodeURIComponent(mine.id)}&date=${encodeURIComponent(today)}`,
          );
          return { att, myClass: mine };
        },
        enabled: Boolean(userId),
      },
    ],
  });

  const queries = [classesQ, studentsQ, attendanceQ];
  const status = combineQueryStatus(queries);
  const isFetching = queries.some((q) => q.isFetching && !q.isPending);
  const errorMessage =
    (classesQ.error ?? studentsQ.error ?? attendanceQ.error) instanceof Error
      ? (classesQ.error ?? studentsQ.error ?? attendanceQ.error)!.message
      : "Failed to load";

  const myClass = useMemo(() => {
    const classes = classesQ.data ?? [];
    return classes.find((c) => c.classTeacherId === userId) ?? attendanceQ.data?.myClass ?? null;
  }, [classesQ.data, attendanceQ.data, userId]);

  const students = useMemo(
    () => (studentsQ.data ?? []).filter((s) => myClass && s.classId === myClass.id),
    [studentsQ.data, myClass],
  );

  const att = attendanceQ.data?.att ?? [];
  const absentees = att.filter((a) => a.status === "absent");

  const metrics = [
    {
      label: "Assigned class",
      value: myClass ? `${myClass.name}${myClass.stream ? ` · ${myClass.stream}` : ""}` : "Unassigned",
      delta: myClass ? "Active" : "Needs assignment",
      deltaTone: myClass ? ("positive" as const) : ("negative" as const),
    },
    { label: "Learners", value: String(students.length), delta: "Class roster", deltaTone: "neutral" as const },
    { label: "Attendance rows", value: String(att.length), delta: "Today", deltaTone: "neutral" as const },
    {
      label: "Absentees today",
      value: String(absentees.length),
      delta: absentees.length > 0 ? "Follow up" : "No issues",
      deltaTone: absentees.length > 0 ? ("negative" as const) : ("positive" as const),
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader title="Class Teacher Dashboard" description="Class operations, attendance, and student follow-up." />
      <AsyncContent
        status={status}
        isFetching={isFetching}
        loading={<DashboardSkeleton />}
        error={
          <ErrorState
            message={errorMessage}
            onRetry={() => void Promise.all(queries.map((q) => q.refetch()))}
          />
        }
      >
        <KpiGrid metrics={metrics} />
        <DashboardTwoColumn
          primary={
            <DashboardPanel title={`Attendance today (${today})`}>
              {myClass ? (
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
                </>
              ) : (
                <EmptyState
                  title="No class assigned"
                  description="Contact admin to assign you as class teacher."
                />
              )}
            </DashboardPanel>
          }
          secondary={
            <DashboardPanel title="Quick links">
              <div className="space-y-2 text-sm">
                <Link className="block text-blue-600 hover:underline dark:text-blue-400" href="/class-teacher/attendance">
                  Open attendance register
                </Link>
                <Link className="block text-blue-600 hover:underline dark:text-blue-400" href="/class-teacher/students">
                  View class list
                </Link>
                <Link className="block text-blue-600 hover:underline dark:text-blue-400" href="/class-teacher/comments">
                  Complete report comments
                </Link>
              </div>
            </DashboardPanel>
          }
        />
      </AsyncContent>
    </div>
  );
}
