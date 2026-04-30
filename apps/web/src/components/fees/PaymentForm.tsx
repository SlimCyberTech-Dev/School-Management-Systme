"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { feePaymentSchema } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiGet, apiPost } from "@/lib/api";

type Form = z.infer<typeof feePaymentSchema>;

type InvoiceRow = {
  id: string;
  student_id: string;
  term_id: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
};

export function PaymentForm({ studentId }: { studentId: string }) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

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
    void (async () => {
      try {
        const rows = await apiGet<InvoiceRow[]>(`/fees/invoices?studentId=${encodeURIComponent(studentId)}`);
        setInvoices(rows);
        if (rows[0]) form.setValue("invoiceId", rows[0].id);
      } catch (e) {
        setLoadErr(e instanceof Error ? e.message : "Failed to load invoices");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- studentId drives reload
  }, [studentId]);

  const onSubmit = async (values: Form) => {
    await apiPost("/fees/payments", values);
    form.reset({ ...values, transactionRef: "" });
  };

  const method = form.watch("method");

  return (
    <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      {loadErr ? <p className="text-sm text-red-600">{loadErr}</p> : null}
      <input type="hidden" {...form.register("studentId")} />
      <Select
        label="Invoice"
        options={invoices.map((i) => ({
          value: i.id,
          label: `${i.id.slice(0, 8)}… balance ${i.balance}`,
        }))}
        {...form.register("invoiceId")}
      />
      <Input
        label="Amount (UGX)"
        {...form.register("amount")}
        error={form.formState.errors.amount?.message}
      />
      <Select
        label="Method"
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
      <Button type="submit">Record payment</Button>
    </form>
  );
}
