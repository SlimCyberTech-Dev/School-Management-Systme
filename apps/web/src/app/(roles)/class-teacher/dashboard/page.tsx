"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHeader, DashboardPanel, DashboardTwoColumn, KpiGrid } from "@/components/layout/shells/DashboardScaffold";
import { apiGet } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type ClassRow = {
  id: string;
  name: string;
  stream?: string;
  classTeacherId?: string | null;
};

type StudentRow = { id: string; fullName: string; studentNumber: string; classId?: string | null };

type AttRow = { status?: string; student_name?: string; student_number?: string };

export default function ClassTeacherDashboardPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const [myClass, setMyClass] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [att, setAtt] = useState<AttRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const [classes, stu] = await Promise.all([
          apiGet<ClassRow[]>("/academic/classes"),
          apiGet<StudentRow[]>("/students"),
        ]);
        const mine = classes.find((c) => c.classTeacherId === userId) ?? null;
        setMyClass(mine);
        const inClass = mine ? stu.filter((s) => s.classId === mine.id) : [];
        setStudents(inClass);
        if (mine) {
          const rows = await apiGet<AttRow[]>(
            `/attendance?classId=${encodeURIComponent(mine.id)}&date=${encodeURIComponent(today)}`,
          );
          setAtt(rows);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, today]);

  const absentees = att.filter((a) => a.status === "absent");

  const metrics = [
    { label: "Assigned class", value: myClass ? `${myClass.name}${myClass.stream ? ` · ${myClass.stream}` : ""}` : "Unassigned" },
    { label: "Learners", value: String(students.length) },
    { label: "Attendance rows", value: String(att.length) },
    { label: "Absentees today", value: String(absentees.length) },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader title="Class Teacher Dashboard" description="Class operations, attendance, and student follow-up." />
      {loading ? <div className="h-24 animate-pulse rounded-xl bg-slate-200" /> : null}
      {err ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</p> : null}
      {!loading && !err ? (
        <>
          <KpiGrid metrics={metrics} />
          <DashboardTwoColumn
            primary={
              <DashboardPanel title={`Attendance today (${today})`}>
                {myClass ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Register rows: {att.length}. Absent: {absentees.length}.
                    </p>
                    {absentees.length ? (
                      <ul className="mt-2 space-y-1 text-sm text-red-700">
                        {absentees.map((a, i) => (
                          <li key={i}>
                            {a.student_name} ({a.student_number})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600">No absentees recorded for this date.</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-600">Assign a class to use attendance.</p>
                )}
              </DashboardPanel>
            }
            secondary={
              <DashboardPanel title="Quick links">
                <div className="space-y-2 text-sm">
                  <Link className="block text-blue-600 hover:underline" href="/class-teacher/attendance">
                    Open attendance register
                  </Link>
                  <Link className="block text-blue-600 hover:underline" href="/class-teacher/students">
                    View class list
                  </Link>
                  <Link className="block text-blue-600 hover:underline" href="/class-teacher/comments">
                    Complete report comments
                  </Link>
                </div>
              </DashboardPanel>
            }
          />
        </>
      ) : null}
    </div>
  );
}
