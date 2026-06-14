"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FeeInvoicesTable } from "@/components/fees/FeeInvoicesTable";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { Card } from "@/components/ui/Card";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useBrowseFeeInvoices, useFeeInvoiceSummary } from "@/hooks/useFees";
import { formatUgx } from "@/lib/formatMoney";
import { queryStatus } from "@/lib/queryStatus";

export default function AdminFeesOverviewPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const summaryQ = useFeeInvoiceSummary();
  const browseQ = useBrowseFeeInvoices({ page, limit, bucket: "all" });
  const status = queryStatus(browseQ);

  const stats = useMemo(() => {
    const s = summaryQ.data;
    if (!s) return { outstanding: 0, collected: 0, flagged: 0, count: 0 };
    return {
      outstanding: Number(s.outstandingUgx),
      collected: Number(s.collectedOnInvoicesUgx),
      flagged: s.arrears,
      count: s.total,
    };
  }, [summaryQ.data]);

  const rows = browseQ.data?.items ?? [];
  const pagination = browseQ.data ?? { page: 1, limit: 25, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Outstanding">
          <p className="text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
            {formatUgx(stats.outstanding)} UGX
          </p>
        </Card>
        <Card title="Collected">
          <p className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatUgx(stats.collected)} UGX
          </p>
        </Card>
        <Card title="Arrears flagged">
          <p className="text-2xl font-semibold tabular-nums">{stats.flagged}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.count} invoices</p>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Record payments in the{" "}
        <Link className="font-medium text-brand hover:underline" href="/bursar/fees/payments">
          bursar portal
        </Link>
        . Configure rates under{" "}
        <Link className="font-medium text-brand hover:underline" href="/admin/fees/publish">
          publish & bill
        </Link>
        {" "}
        and{" "}
        <Link className="font-medium text-brand hover:underline" href="/admin/fees/structure">
          fee structure
        </Link>
        .
      </p>

      <Card title={`School invoices (${pagination.total})`}>
        <AsyncContent
          status={status}
          loading={<FormSkeleton fields={4} />}
          error={
            <ErrorState
              message={
                browseQ.error instanceof Error ? browseQ.error.message : "Could not load invoices."
              }
              onRetry={() => void browseQ.refetch()}
            />
          }
        >
          <FeeInvoicesTable
            rows={rows}
            invoiceBasePath="/bursar/fees/invoices"
            studentBasePath="/admin/students"
          />
          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </AsyncContent>
      </Card>
    </div>
  );
}
