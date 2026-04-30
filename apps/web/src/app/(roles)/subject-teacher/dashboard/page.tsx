"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHeader, DashboardPanel, DashboardTwoColumn, KpiGrid } from "@/components/layout/shells/DashboardScaffold";
import { apiGet } from "@/lib/api";

type TermRow = { id: string; isActive?: boolean; termNumber?: number };
type CbcRow = { submitted?: boolean; id: string };
type Stu = { id: string; fullName: string; studentNumber: string };

export default function SubjectTeacherDashboardPage() {
  const [students, setStudents] = useState<Stu[]>([]);
  const [termId, setTermId] = useState<string | null>(null);
  const [cbcRows, setCbcRows] = useState<CbcRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [stu, terms] = await Promise.all([
          apiGet<Stu[]>("/students"),
          apiGet<TermRow[]>("/academic/terms"),
        ]);
        setStudents(stu);
        const active = terms.find((t) => t.isActive) ?? terms[0] ?? null;
        setTermId(active?.id ?? null);
        if (active?.id) {
          const rows = await apiGet<CbcRow[]>(`/assessments/cbc?termId=${encodeURIComponent(active.id)}`);
          setCbcRows(rows);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submitted = cbcRows.filter((r) => r.submitted).length;
  const pending = cbcRows.length - submitted;

  const metrics = [
    { label: "Learners in scope", value: String(students.length) },
    { label: "Submitted rows", value: String(submitted) },
    { label: "Pending rows", value: String(pending) },
    { label: "Active term", value: termId ? "Configured" : "Not set" },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader title="Subject Teacher Dashboard" description="Assessment tracking and learner performance workflow." />
      {loading ? <div className="h-24 animate-pulse rounded-xl bg-slate-200" /> : null}
      {err ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</p> : null}
      {!loading && !err ? (
        <>
          <KpiGrid metrics={metrics} />
          <DashboardTwoColumn
            primary={
              <DashboardPanel title="Learner snapshot">
                <ul className="max-h-48 space-y-1 overflow-auto text-sm">
                  {students.slice(0, 8).map((s) => (
                    <li key={s.id}>
                      <Link className="text-blue-600 hover:underline" href={`/subject-teacher/students/${s.id}`}>
                        {s.fullName} ({s.studentNumber})
                      </Link>
                    </li>
                  ))}
                </ul>
              </DashboardPanel>
            }
            secondary={
              <DashboardPanel title="Assessment actions">
                <div className="space-y-2 text-sm">
                  <Link href="/subject-teacher/assessment/cbc" className="block text-blue-600 hover:underline">
                    Open CBC assessment
                  </Link>
                  <Link href="/subject-teacher/assessment/alevel" className="block text-blue-600 hover:underline">
                    Open A-Level assessment
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
