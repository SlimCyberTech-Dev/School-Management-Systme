"use client";

import Link from "next/link";
import type { FeeInvoice } from "@uganda-cbc-sms/shared";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { formatUgx } from "@/lib/formatMoney";

export function FeeInvoicesTable({
  rows,
  invoiceBasePath = "/bursar/fees/invoices",
  studentBasePath = "/bursar/students",
  emptyMessage = "No invoices found.",
}: {
  rows: FeeInvoice[];
  invoiceBasePath?: string;
  studentBasePath?: string;
  emptyMessage?: string;
}) {
  const columns: Column<FeeInvoice>[] = [
    {
      key: "student",
      header: "Student",
      render: (r) => (
        <div>
          <Link className="font-medium text-brand hover:underline" href={`${studentBasePath}/${r.studentId}`}>
            {r.studentName ?? "Student"}
          </Link>
          {r.studentNumber ? (
            <p className="text-xs text-muted-foreground">#{r.studentNumber}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "term",
      header: "Term",
      render: (r) => (
        <span className="text-sm">
          {r.termLabel ?? "—"}
          {r.yearName ? <span className="text-muted-foreground"> · {r.yearName}</span> : null}
        </span>
      ),
    },
    {
      key: "billed",
      header: "Billed",
      render: (r) => <span className="tabular-nums">{formatUgx(r.totalAmount)}</span>,
    },
    {
      key: "paid",
      header: "Paid",
      render: (r) => <span className="tabular-nums">{formatUgx(r.amountPaid)}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      render: (r) => (
        <span className={`tabular-nums font-medium ${Number(r.balance) > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
          {formatUgx(r.balance)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const bal = Number(r.balance);
        if (bal <= 0) return <Badge tone="success">Paid</Badge>;
        if (r.isFlagged) return <Badge tone="warning">Arrears</Badge>;
        return <Badge tone="neutral">Outstanding</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Link className="text-xs font-medium text-brand hover:underline" href={`${invoiceBasePath}/${r.id}`}>
          View
        </Link>
      ),
    },
  ];

  return (
    <Table
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      rows={rows as unknown as Record<string, unknown>[]}
      emptyState={<p className="text-sm text-muted-foreground">{emptyMessage}</p>}
    />
  );
}
