"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHeader, DashboardPanel, DashboardTwoColumn, KpiGrid } from "@/components/layout/shells/DashboardScaffold";
import { apiGet } from "@/lib/api";

type Kpis = {
  activeStudents: string;
  totalFeesDue: string;
  totalFeesPaid: string;
};

type TermRow = {
  id: string;
  termNumber?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

type InvRow = Record<string, unknown>;

export default function HeadteacherDashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [flagged, setFlagged] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [k, t, inv] = await Promise.all([
          apiGet<Kpis>("/analytics/dashboard"),
          apiGet<TermRow[]>("/academic/terms"),
          apiGet<InvRow[]>("/fees/invoices"),
        ]);
        setKpis(k);
        setTerms(t);
        setFlagged(inv.filter((r) => r.is_flagged === true || r["is_flagged"] === true).length);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeTerms = terms.filter((x) => x.isActive);
  const current = activeTerms[0];

  const daysRemaining = (() => {
    if (!current?.endDate) return null;
    const end = new Date(String(current.endDate)).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (86400 * 1000)));
  })();

  const metrics = kpis
    ? [
        { label: "Active students", value: kpis.activeStudents },
        { label: "Fees collected", value: kpis.totalFeesPaid, helper: `Due ${kpis.totalFeesDue} UGX` },
        {
          label: "Current term",
          value: current ? `Term ${current.termNumber ?? "?"}` : "Not set",
          helper: daysRemaining !== null ? `${daysRemaining} days remaining` : "Set active term",
        },
        { label: "Flagged invoices", value: String(flagged) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Headteacher Dashboard"
        description="Academic and financial oversight for school leadership."
      />
      {loading ? <div className="h-32 animate-pulse rounded-xl bg-slate-200" /> : null}
      {err ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</p> : null}
      {!loading && !err && kpis ? (
        <>
          <KpiGrid metrics={metrics} />
          <DashboardTwoColumn
            primary={
              <DashboardPanel title="Academic approvals">
                <p className="text-sm text-slate-600">
                  Pending approvals will appear here once report approval APIs are connected.
                </p>
              </DashboardPanel>
            }
            secondary={
              <DashboardPanel title="Leadership actions">
                <div className="space-y-2 text-sm">
                  <Link href="/headteacher/reports" className="block text-blue-600 hover:underline">
                    Review report cards
                  </Link>
                  <Link href="/headteacher/assessment/cbc/unlock" className="block text-blue-600 hover:underline">
                    Unlock CBC assessments
                  </Link>
                  <Link href="/headteacher/analytics" className="block text-blue-600 hover:underline">
                    Open analytics
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
