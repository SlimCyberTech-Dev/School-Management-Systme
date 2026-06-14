"use client";

import { useMemo } from "react";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { BursarCollectionsHub } from "@/components/fees/bursar/BursarCollectionsHub";
import {
  useBrowseFeeInvoices,
  useFeeInvoiceSummary,
  useRecentFeePayments,
} from "@/hooks/useFees";
import { summaryToInvoiceStats } from "@/lib/feeFinanceStats";
import { queryStatus } from "@/lib/queryStatus";

export default function BursarFeesOverviewPage() {
  const summaryQ = useFeeInvoiceSummary();
  const activeQ = useBrowseFeeInvoices({ bucket: "active", page: 1, limit: 10 });
  const arrearsQ = useBrowseFeeInvoices({ bucket: "arrears", page: 1, limit: 6 });
  const paymentsQ = useRecentFeePayments(8);
  const status = queryStatus(summaryQ);

  const stats = useMemo(
    () =>
      summaryQ.data
        ? summaryToInvoiceStats(summaryQ.data)
        : {
            total: 0,
            active: 0,
            paid: 0,
            arrears: 0,
            partial: 0,
            outstandingUgx: 0,
            collectedOnInvoicesUgx: 0,
            billedUgx: 0,
          },
    [summaryQ.data],
  );

  return (
    <AsyncContent
      status={status}
      loading={<FormSkeleton fields={4} />}
      error={
        <ErrorState
          message={summaryQ.error instanceof Error ? summaryQ.error.message : "Could not load fees."}
          onRetry={() => void summaryQ.refetch()}
        />
      }
    >
      <BursarCollectionsHub
        stats={stats}
        activeRows={activeQ.data?.items ?? []}
        arrearsRows={arrearsQ.data?.items ?? []}
        payments={paymentsQ.data ?? []}
      />
    </AsyncContent>
  );
}
