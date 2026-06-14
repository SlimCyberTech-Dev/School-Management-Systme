"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { BulkInvoiceForm } from "@/components/fees/BulkInvoiceForm";
import { BursarFinanceStats } from "@/components/fees/bursar/BursarFinanceStats";
import { BursarInvoiceFilters } from "@/components/fees/bursar/BursarInvoiceFilters";
import { FeeInvoicesTable } from "@/components/fees/FeeInvoicesTable";
import { InvoiceCreateForm } from "@/components/fees/InvoiceCreateForm";
import { Card } from "@/components/ui/Card";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useBrowseFeeInvoices, useFeeInvoiceSummary, useFeeInvoiceTerms } from "@/hooks/useFees";
import { summaryToInvoiceStats, type InvoiceBucket } from "@/lib/feeFinanceStats";
import { queryStatus } from "@/lib/queryStatus";

type MainTab = "invoices" | "create" | "bulk";

function initialBucket(tab: string | null): InvoiceBucket {
  if (tab === "arrears") return "arrears";
  if (tab === "paid") return "paid";
  if (tab === "all") return "all";
  return "active";
}

function initialMainTab(tab: string | null): MainTab {
  if (tab === "create") return "create";
  if (tab === "bulk") return "bulk";
  return "invoices";
}

export default function BursarInvoicesListPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [mainTab, setMainTab] = useState<MainTab>(() => initialMainTab(tabParam));
  const [search, setSearch] = useState("");
  const [termId, setTermId] = useState("");
  const [bucket, setBucket] = useState<InvoiceBucket>(() => initialBucket(tabParam));
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

  const tabButtons: { key: MainTab; label: string; count?: number }[] = [
    { key: "invoices", label: "Track invoices", count: stats.active },
    { key: "create", label: "New invoice" },
    { key: "bulk", label: "Bill class" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabButtons.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-ui ${
              mainTab === key ? "bg-brand text-white" : "text-muted-foreground hover:bg-accent/50"
            }`}
            onClick={() => setMainTab(key)}
          >
            {label}
            {count !== undefined && key === "invoices" ? ` (${count} active)` : ""}
          </button>
        ))}
      </div>

      {mainTab === "create" ? (
        <Card title="Create invoice for one student">
          <InvoiceCreateForm onCreated={() => void browseQ.refetch()} />
        </Card>
      ) : mainTab === "bulk" ? (
        <Card title="Bill entire class from fee schedule">
          <BulkInvoiceForm onDone={() => void browseQ.refetch()} />
        </Card>
      ) : (
        <>
          <BursarFinanceStats stats={stats} variant="compact" />

          <Card title={`Showing ${pagination.total} invoice${pagination.total === 1 ? "" : "s"}`}>
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
            <div className="mt-4">
              <AsyncContent
                status={status}
                loading={<FormSkeleton fields={4} />}
                error={
                  <ErrorState
                    message={
                      browseQ.error instanceof Error
                        ? browseQ.error.message
                        : "Could not load invoices."
                    }
                    onRetry={() => void browseQ.refetch()}
                  />
                }
              >
                <FeeInvoicesTable
                  rows={rows}
                  emptyMessage={
                    bucket === "active"
                      ? "No unpaid invoices for this filter."
                      : "No invoices match your filters."
                  }
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
          </Card>
        </>
      )}
    </div>
  );
}
