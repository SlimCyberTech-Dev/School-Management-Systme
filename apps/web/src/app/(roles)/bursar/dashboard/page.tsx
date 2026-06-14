"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { BursarDashboardContent } from "@/components/bursar/BursarDashboardContent";
import { DashboardSkeleton } from "@/components/layout/shells/DashboardScaffold";
import { apiGet } from "@/lib/api";
import { useFeeInvoiceSummary, useRecentFeePayments } from "@/hooks/useFees";
import { combineQueryStatus } from "@/lib/queryStatus";

type Kpis = { activeStudents: string; totalFeesDue: string; totalFeesPaid: string };

export default function BursarDashboardPage() {
  const summaryQ = useFeeInvoiceSummary();
  const paymentsQ = useRecentFeePayments(8);
  const kpisQ = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: () => apiGet<Kpis>("/analytics/dashboard"),
  });

  const queries = [kpisQ, paymentsQ, summaryQ];
  const status = combineQueryStatus(queries);
  const isFetching = queries.some((q) => q.isFetching && !q.isPending);
  const errorMessage =
    (kpisQ.error ?? paymentsQ.error ?? summaryQ.error) instanceof Error
      ? (kpisQ.error ?? paymentsQ.error ?? summaryQ.error)!.message
      : "Failed to load dashboard";

  const invoiceStats = useMemo(() => {
    const s = summaryQ.data;
    if (!s) {
      return { active: 0, arrears: 0 };
    }
    return { active: s.active, arrears: s.arrears };
  }, [summaryQ.data]);

  const recent = useMemo(() => paymentsQ.data ?? [], [paymentsQ.data]);

  const exportRecentCsv = () => {
    if (!recent.length) return;
    const header = ["Receipt", "Student", "Amount", "Method", "Paid at"];
    const lines = recent.map((p) =>
      [p.receiptNumber, p.studentName ?? "", p.amount, p.method, p.paidAt].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recent-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
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
      {kpisQ.data ? (
        <BursarDashboardContent
          kpis={kpisQ.data}
          arrearsCount={invoiceStats.arrears}
          activeBillsCount={invoiceStats.active}
          recentPayments={recent}
          onExportPayments={exportRecentCsv}
        />
      ) : null}
    </AsyncContent>
  );
}
