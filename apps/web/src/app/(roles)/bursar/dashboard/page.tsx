"use client";

import { useEffect, useState } from "react";
import { DashboardHeader, DashboardPanel, DashboardTwoColumn, KpiGrid } from "@/components/layout/shells/DashboardScaffold";
import { apiGet } from "@/lib/api";

type Kpis = {
  activeStudents: string;
  totalFeesDue: string;
  totalFeesPaid: string;
};

type PayRow = Record<string, unknown>;
type InvRow = Record<string, unknown>;

export default function BursarDashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [recent, setRecent] = useState<PayRow[]>([]);
  const [flagged, setFlagged] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [k, pay, inv] = await Promise.all([
          apiGet<Kpis>("/analytics/dashboard"),
          apiGet<PayRow[]>("/fees/payments"),
          apiGet<InvRow[]>("/fees/invoices"),
        ]);
        setKpis(k);
        setRecent(pay.slice(0, 5));
        setFlagged(inv.filter((r) => r.is_flagged === true || r["is_flagged"] === true).length);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = kpis
    ? [
        { label: "Fees due (UGX)", value: kpis.totalFeesDue },
        { label: "Fees collected (UGX)", value: kpis.totalFeesPaid },
        { label: "Flagged invoices", value: String(flagged) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <DashboardHeader title="Bursar Dashboard" description="Financial health, collections, and payment operations." />
      {loading ? <div className="h-24 animate-pulse rounded-xl bg-muted" /> : null}
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
              <DashboardPanel title="Recent payments (latest 5)">
                <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(recent, null, 2)}</pre>
              </DashboardPanel>
            }
            secondary={
              <DashboardPanel title="Finance actions">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Record new payments and track invoice exceptions from the fees module.</p>
                </div>
              </DashboardPanel>
            }
          />
        </>
      ) : null}
    </div>
  );
}
