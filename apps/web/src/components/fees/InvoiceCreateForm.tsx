"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { feeInvoiceSchema } from "@uganda-cbc-sms/shared";
import type { Term } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StudentSearchPicker, type PickedStudent } from "@/components/fees/StudentSearchPicker";
import { useFeeActions } from "@/hooks/useFees";
import { apiGet } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api";
import { useState } from "react";

type Form = z.infer<typeof feeInvoiceSchema>;

function termLabel(t: Term) {
  return `Term ${t.termNumber}`;
}

export function InvoiceCreateForm({ onCreated }: { onCreated?: () => void }) {
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const termsQ = useQuery({
    queryKey: ["terms"],
    queryFn: () => apiGet<Term[]>("/academic/terms"),
  });
  const actions = useFeeActions();

  const form = useForm<Form>({
    resolver: zodResolver(feeInvoiceSchema),
    defaultValues: { totalAmount: "" },
  });

  const termOptions = useMemo(
    () =>
      (termsQ.data ?? []).map((t) => ({
        value: t.id,
        label: termLabel(t),
      })),
    [termsQ.data],
  );

  const onSubmit = async (values: Form) => {
    if (!student) return;
    try {
      await actions.createInvoice.mutateAsync({
        ...values,
        studentId: student.id,
        totalAmount: String(values.totalAmount),
      });
      form.reset({ totalAmount: "", termId: values.termId });
      setStudent(null);
      onCreated?.();
    } catch {
      /* mutation error state */
    }
  };

  const err = actions.createInvoice.error ? getApiErrorMessage(actions.createInvoice.error) : null;

  return (
    <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <StudentSearchPicker selected={student} onSelect={setStudent} />
      <Select
        label="Term"
        options={[{ value: "", label: termsQ.isLoading ? "Loading terms…" : "Select term" }, ...termOptions]}
        {...form.register("termId")}
        error={form.formState.errors.termId?.message}
      />
      <Input
        label="Total amount (UGX)"
        type="number"
        min={1}
        step={1}
        {...form.register("totalAmount")}
        error={form.formState.errors.totalAmount?.message}
      />
      {err ? <Alert tone="error">{err}</Alert> : null}
      {actions.createInvoice.isSuccess ? (
        <Alert tone="success">Invoice created successfully.</Alert>
      ) : null}
      <Button type="submit" loading={actions.createInvoice.isPending} disabled={!student}>
        Create invoice
      </Button>
    </form>
  );
}
