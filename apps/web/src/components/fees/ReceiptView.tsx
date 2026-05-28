"use client";

import { Card } from "@/components/ui/Card";
import { formatUgx, paymentMethodLabel } from "@/lib/formatMoney";

export type PaymentReceipt = {
  receipt_number?: string;
  amount?: string | number;
  method?: string;
  transaction_ref?: string | null;
  paid_at?: string;
  student_id?: string;
  student_name?: string;
};

export function ReceiptView({ payment }: { payment: PaymentReceipt }) {
  const paidAt = payment.paid_at
    ? new Date(payment.paid_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  return (
    <Card title="Payment receipt">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Receipt number</dt>
          <dd className="font-mono font-semibold text-foreground">{payment.receipt_number ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="tabular-nums font-semibold">{formatUgx(payment.amount)} UGX</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Method</dt>
          <dd>{paymentMethodLabel(payment.method)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paid at</dt>
          <dd>{paidAt}</dd>
        </div>
        {payment.student_name ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Student</dt>
            <dd>{payment.student_name}</dd>
          </div>
        ) : null}
        {payment.transaction_ref ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Transaction reference</dt>
            <dd className="font-mono text-xs">{payment.transaction_ref}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}
