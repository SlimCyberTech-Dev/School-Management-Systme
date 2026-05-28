"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { feeBulkInvoiceSchema } from "@uganda-cbc-sms/shared";
import type { Term } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useClassEnrollmentSummary } from "@/hooks/useStudentsBrowse";
import { useFeeActions } from "@/hooks/useFees";
import { apiGet } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api";
import { formatUgx } from "@/lib/formatMoney";

type Form = z.infer<typeof feeBulkInvoiceSchema>;

export function BulkInvoiceForm({ onDone }: { onDone?: () => void }) {
  const summaryQ = useClassEnrollmentSummary();
  const termsQ = useQuery({
    queryKey: ["terms"],
    queryFn: () => apiGet<Term[]>("/academic/terms"),
  });
  const actions = useFeeActions();

  const form = useForm<Form>({
    resolver: zodResolver(feeBulkInvoiceSchema),
  });

  const classOptions = useMemo(
    () =>
      (summaryQ.data ?? []).map((c) => ({
        value: c.classId,
        label: c.classStream
          ? `${c.className} · ${c.classStream} (${c.activeCount} students)`
          : `${c.className} (${c.activeCount})`,
      })),
    [summaryQ.data],
  );

  const termOptions = useMemo(
    () => (termsQ.data ?? []).map((t) => ({ value: t.id, label: `Term ${t.termNumber}` })),
    [termsQ.data],
  );

  const onSubmit = async (values: Form) => {
    try {
      await actions.bulkInvoices.mutateAsync(values);
      onDone?.();
    } catch {
      /* shown below */
    }
  };

  const result = actions.bulkInvoices.data;
  const err = actions.bulkInvoices.error ? getApiErrorMessage(actions.bulkInvoices.error) : null;

  return (
    <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <p className="text-sm text-muted-foreground">
        Bill every active student in a class using the fee structure configured by the administrator (sum of
        all categories for that class and term).
      </p>
      <Select
        label="Class"
        options={[{ value: "", label: "Select class" }, ...classOptions]}
        {...form.register("classId")}
        error={form.formState.errors.classId?.message}
      />
      <Select
        label="Term"
        options={[{ value: "", label: "Select term" }, ...termOptions]}
        {...form.register("termId")}
        error={form.formState.errors.termId?.message}
      />
      {err ? <Alert tone="error">{err}</Alert> : null}
      {result ? (
        <Alert tone="success">
          Created <strong>{result.created}</strong> invoice{result.created === 1 ? "" : "s"} at{" "}
          {formatUgx(result.totalAmount)} UGX each
          {result.skipped > 0 ? ` · ${result.skipped} skipped (already had invoices)` : ""}.
        </Alert>
      ) : null}
      <Button type="submit" loading={actions.bulkInvoices.isPending}>
        Generate class invoices
      </Button>
    </form>
  );
}
