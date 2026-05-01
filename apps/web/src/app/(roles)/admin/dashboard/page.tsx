"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  DashboardHeader,
  DashboardPanel,
  DashboardTwoColumn,
  KpiGrid,
} from "@/components/layout/shells/DashboardScaffold";
import { apiGet } from "@/lib/api";

type Kpis = {
  activeStudents: string;
  totalFeesDue: string;
  totalFeesPaid: string;
};

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
};

type StudentRow = {
  id: string;
  studentNumber: string;
  fullName: string;
  enrolledAt?: string;
};

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [teachers, setTeachers] = useState(0);
  const [recent, setRecent] = useState<StudentRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [k, users, students] = await Promise.all([
          apiGet<Kpis>("/analytics/dashboard"),
          apiGet<UserRow[]>("/users"),
          apiGet<StudentRow[]>("/students"),
        ]);
        setKpis(k);
        const teacherRoles = new Set([
          "class_teacher",
          "subject_teacher",
          "headteacher",
        ]);
        setTeachers(
          users.filter((u) => u.isActive !== false && teacherRoles.has(u.role)).length,
        );
        const sorted = [...students].sort((a, b) => {
          const ta = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0;
          const tb = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0;
          return tb - ta;
        });
        setRecent(sorted.slice(0, 5));
        const due = Number(k.totalFeesDue ?? 0);
        const paid = Number(k.totalFeesPaid ?? 0);
        void due;
        void paid;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const collectionRate =
    kpis && Number(kpis.totalFeesDue) > 0
      ? Math.round((Number(kpis.totalFeesPaid) / Number(kpis.totalFeesDue)) * 100)
      : 0;

  const metrics = kpis
    ? [
        { label: "Total students", value: kpis.activeStudents },
        { label: "Active teachers", value: String(teachers) },
        {
          label: "Collection rate",
          value: `${collectionRate}%`,
          helper: `Paid ${kpis.totalFeesPaid} / Due ${kpis.totalFeesDue} UGX`,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Admin Dashboard"
        description="School overview, operational status, and quick actions."
        actions={
          <>
            <Link href="/admin/students/enrol">
              <Button>Enrol student</Button>
            </Link>
            <Link href="/admin/users/create">
              <Button variant="secondary">Create user</Button>
            </Link>
          </>
        }
      />

      {loading ? <div className="h-32 animate-pulse rounded-xl bg-muted" /> : null}
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {err}
        </p>
      ) : null}

      {!loading && !err && kpis ? (
        <>
          <KpiGrid metrics={metrics} />
          <DashboardTwoColumn
            primary={
              <DashboardPanel title="Recent enrolments" subtitle="Latest admitted students">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2">Student #</th>
                      <th className="py-2">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((s) => (
                      <tr key={s.id} className="border-b border-border">
                        <td className="py-2 font-mono text-xs">{s.studentNumber}</td>
                        <td className="py-2">{s.fullName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DashboardPanel>
            }
            secondary={
              <DashboardPanel title="Quick links">
                <div className="space-y-2 text-sm">
                  <Link className="block text-blue-600 hover:underline dark:text-blue-400" href="/admin/academic/years">
                    Manage academic years
                  </Link>
                  <Link className="block text-blue-600 hover:underline dark:text-blue-400" href="/admin/reports">
                    Open reports center
                  </Link>
                  <Link className="block text-blue-600 hover:underline dark:text-blue-400" href="/admin/fees/overview">
                    View fees overview
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
