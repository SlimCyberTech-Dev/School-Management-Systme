"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { feePaymentSchema } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ReceiptView } from "@/components/fees/ReceiptView";
import { useFeeActions, useFeeInvoices } from "@/hooks/useFees";
import { formatUgx, paymentMethodLabel } from "@/lib/formatMoney";
import { getApiErrorMessage } from "@/lib/api";

type Form = z.infer<typeof feePaymentSchema>;

export function PaymentForm({
  studentId,
  onSuccess,
}: {
  studentId: string;
  onSuccess?: (receiptNumber: string) => void;
}) {
  const invoicesQ = useFeeInvoices(studentId);
  const actions = useFeeActions();
  const invoices = (invoicesQ.data ?? []).filter((i) => Number(i.balance) > 0);

  const form = useForm<Form>({
    resolver: zodResolver(feePaymentSchema),
    defaultValues: {
      studentId,
      method: "cash",
      transactionRef: "",
    },
  });

  useEffect(() => {
    form.setValue("studentId", studentId);
  }, [studentId, form]);

  useEffect(() => {
    if (invoices[0] && !form.getValues("invoiceId")) {
      form.setValue("invoiceId", invoices[0].id);
    }
  }, [invoices, form]);

  const method = form.watch("method");
  const selectedInvoiceId = form.watch("invoiceId");
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const onSubmit = async (values: Form) => {
    try {
      const result = await actions.recordPayment.mutateAsync(values);
      form.reset({
        studentId,
        invoiceId: values.invoiceId,
        method: values.method,
        amount: "",
        transactionRef: "",
      });
      onSuccess?.(result.receiptNumber);
    } catch {
      /* error shown via mutation state */
    }
  };

  const lastReceipt = actions.recordPayment.data;
  const payError = actions.recordPayment.error
    ? getApiErrorMessage(actions.recordPayment.error)
    : null;
  const paySuccess = actions.recordPayment.isSuccess && lastReceipt;

  return (
    <div className="space-y-4">
      {invoicesQ.isError ? (
        <Alert tone="error">{getApiErrorMessage(invoicesQ.error)}</Alert>
      ) : null}
      {invoicesQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading invoices…</p>
      ) : invoices.length === 0 ? (
        <Alert tone="info">
          This student has no unpaid invoices. Create an invoice first, then record a payment here.
        </Alert>
      ) : (
        <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("studentId")} />
          <Select
            label="Invoice"
            options={invoices.map((i) => ({
              value: i.id,
              label: `${i.termLabel ?? "Term"} · ${formatUgx(i.balance)} UGX outstanding`,
            }))}
            {...form.register("invoiceId")}
          />
          {selectedInvoice ? (
            <p className="text-xs text-muted-foreground">
              Billed {formatUgx(selectedInvoice.totalAmount)} UGX · Paid{" "}
              {formatUgx(selectedInvoice.amountPaid)} UGX
            </p>
          ) : null}
          <Input
            label="Amount (UGX)"
            type="number"
            min={1}
            step={1}
            {...form.register("amount")}
            error={form.formState.errors.amount?.message}
          />
          <Select
            label="Payment method"
            options={[
              { value: "cash", label: "Cash" },
              { value: "mobile_money", label: "Mobile money" },
            ]}
            {...form.register("method")}
          />
          {method === "mobile_money" ? (
            <Input
              label="Transaction reference"
              {...form.register("transactionRef")}
              error={form.formState.errors.transactionRef?.message}
            />
          ) : null}
          {payError ? <Alert tone="error">{payError}</Alert> : null}
          {paySuccess ? (
            <Alert tone="success">
              Payment recorded. Receipt <strong>{lastReceipt.receiptNumber}</strong>. Remaining balance:{" "}
              {formatUgx(lastReceipt.balance)} UGX.
            </Alert>
          ) : null}
          <Button type="submit" loading={actions.recordPayment.isPending}>
            Record payment
          </Button>
        </form>
      )}
      {paySuccess ? (
        <ReceiptView
          payment={{
            receipt_number: lastReceipt.receiptNumber,
            amount: form.getValues("amount") || "—",
            method: paymentMethodLabel(method),
            paid_at: new Date().toISOString(),
          }}
        />
      ) : null}
    </div>
  );
}
