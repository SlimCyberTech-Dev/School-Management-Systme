"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { apiGet } from "@/lib/api";

type Kpis = {
  activeStudents: string;
  totalFeesDue: string;
  totalFeesPaid: string;
  averageCbcNumeric: string;
  averageAlevelScore: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<Kpis | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const k = await apiGet<Kpis>("/analytics/dashboard");
        setData(k);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageWrapper title="Dashboard" description="School-wide KPIs">
      {loading ? <p className="text-slate-600">Loading…</p> : null}
      {err ? <p className="text-red-600">{err}</p> : null}
      {data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Active students">
            <p className="text-3xl font-bold text-brand">{data.activeStudents}</p>
          </Card>
          <Card title="Fees due (UGX)">
            <p className="text-xl font-semibold">{data.totalFeesDue}</p>
          </Card>
          <Card title="Fees collected (UGX)">
            <p className="text-xl font-semibold">{data.totalFeesPaid}</p>
          </Card>
          <Card title="Avg CBC (numeric approx.)">
            <p className="text-xl font-semibold">{data.averageCbcNumeric}</p>
          </Card>
          <Card title="Avg A-Level score">
            <p className="text-xl font-semibold">{data.averageAlevelScore}</p>
          </Card>
        </div>
      ) : null}
    </PageWrapper>
  );
}
