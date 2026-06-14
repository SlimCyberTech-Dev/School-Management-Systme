"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { BursarInvoiceFilters } from "@/components/fees/bursar/BursarInvoiceFilters";
import { FeeInvoicesTable } from "@/components/fees/FeeInvoicesTable";
import { Alert } from "@/components/ui/Alert";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useBrowseFeeInvoices, useFeeInvoiceSummary, useFeeInvoiceTerms } from "@/hooks/useFees";
import { summaryToInvoiceStats, type InvoiceBucket } from "@/lib/feeFinanceStats";
import { queryStatus } from "@/lib/queryStatus";

function initialBucket(tab: string | null): InvoiceBucket {
  if (tab === "arrears") return "arrears";
  if (tab === "paid") return "paid";
  if (tab === "active") return "active";
  return "active";
}

export default function HeadteacherFeesInvoicesPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [termId, setTermId] = useState("");
  const [bucket, setBucket] = useState<InvoiceBucket>(() => initialBucket(searchParams.get("tab")));
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    setPage(1);
  }, [bucket, termId, search, limit]);

  const summaryQ = useFeeInvoiceSummary(termId || undefined);
  const termsQ = useFeeInvoiceTerms();
  const browseQ = useBrowseFeeInvoices({
    page,
    limit,
    bucket,
    termId: termId || undefined,
    q: search || undefined,
  });

  const status = queryStatus(browseQ);
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

  const termOptions = useMemo(
    () => (termsQ.data ?? []).map((t) => ({ termId: t.termId, label: t.label })),
    [termsQ.data],
  );

  const bucketCounts = useMemo(
    () => ({
      active: stats.active,
      partial: stats.partial,
      arrears: stats.arrears,
      paid: stats.paid,
      all: stats.total,
    }),
    [stats],
  );

  const rows = browseQ.data?.items ?? [];
  const pagination = browseQ.data ?? { page: 1, limit: 25, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <Alert tone="info">Browse school invoices and balances. Contact the bursar to record payments.</Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <div className="mt-1">
            <MoneyAmount amount={stats.outstandingUgx} compact size="lg" tone="warning" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Active bills</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Collected</p>
          <div className="mt-1">
            <MoneyAmount amount={stats.collectedOnInvoicesUgx} compact size="lg" tone="positive" />
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Invoices ({pagination.total} total)
          </h2>
        </div>
        <div className="p-5">
          <BursarInvoiceFilters
            search={search}
            onSearchChange={setSearch}
            bucket={bucket}
            onBucketChange={setBucket}
            termId={termId}
            onTermIdChange={setTermId}
            termOptions={termOptions}
            counts={bucketCounts}
          />
          <div className="mt-4 overflow-x-auto">
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
                studentBasePath="/headteacher/students"
                invoiceBasePath="/headteacher/fees/invoices"
                showCollectAction={false}
                emptyMessage="No invoices match your filters."
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
          </div>
        </div>
      </section>
    </div>
  );
}
