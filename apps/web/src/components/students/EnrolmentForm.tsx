"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createStudentSchema } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiGet, apiPost } from "@/lib/api";

type Form = z.infer<typeof createStudentSchema>;

type ClassOpt = { id: string; name: string; stream: string };
type ComboOpt = { id: string; code: string; name: string };

export function EnrolmentForm({ onCreated }: { onCreated?: (id: string) => void }) {
  const [classes, setClasses] = useState<ClassOpt[]>([]);
  const [combos, setCombos] = useState<ComboOpt[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      gender: "male",
      combinationId: null,
      guardianEmail: "",
      address: "",
      previousSchool: "",
    },
  });

  useEffect(() => {
    void (async () => {
      try {
        const [c, k] = await Promise.all([
          apiGet<ClassOpt[]>("/academic/classes"),
          apiGet<ComboOpt[]>("/academic/combinations"),
        ]);
        setClasses(c);
        setCombos(k);
        if (c[0]) {
          form.setValue("classId", c[0].id);
        }
      } catch (e) {
        setLoadErr(e instanceof Error ? e.message : "Failed to load lookups");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const onSubmit = async (values: Form) => {
    setSubmitErr(null);
    setSubmitOk(null);
    try {
      const payload = {
        ...values,
        guardianEmail: values.guardianEmail?.trim() || null,
        address: values.address?.trim() || null,
        previousSchool: values.previousSchool?.trim() || null,
        combinationId:
          values.combinationId && String(values.combinationId).length > 0
            ? values.combinationId
            : undefined,
      };
      const row = await apiPost<{ id: string }>("/students", payload);
      onCreated?.(row.id);
      if (!onCreated) {
        setSubmitOk("Student enrolled successfully.");
      }
      form.reset({
        fullName: "",
        dateOfBirth: "",
        gender: "male",
        guardianName: "",
        guardianContact: "",
        guardianEmail: "",
        address: "",
        previousSchool: "",
        classId: values.classId,
        combinationId: null,
      });
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : "Enrolment failed");
    }
  };

  return (
    <form className="max-w-xl space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      {submitOk ? <Alert tone="success">{submitOk}</Alert> : null}
      {loadErr ? <Alert tone="error">{loadErr}</Alert> : null}
      <Input label="Full name" {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
      <Input
        label="Date of birth"
        type="date"
        {...form.register("dateOfBirth")}
        error={form.formState.errors.dateOfBirth?.message}
      />
      <Select
        label="Gender"
        options={[
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
        ]}
        {...form.register("gender")}
      />
      <Input
        label="Guardian name"
        {...form.register("guardianName")}
        error={form.formState.errors.guardianName?.message}
      />
      <Input
        label="Guardian contact"
        {...form.register("guardianContact")}
        error={form.formState.errors.guardianContact?.message}
      />
      <Input
        label="Guardian email (optional)"
        type="email"
        {...form.register("guardianEmail")}
        error={form.formState.errors.guardianEmail?.message}
      />
      <div className="w-full">
        <label htmlFor="enrol-address" className="mb-1 block text-sm font-medium text-foreground">
          Address (optional)
        </label>
        <textarea
          id="enrol-address"
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-ui placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          {...form.register("address")}
        />
      </div>
      <Input
        label="Previous school (optional)"
        {...form.register("previousSchool")}
        error={form.formState.errors.previousSchool?.message}
      />
      <Select
        label="Class"
        options={classes.map((x) => ({
          value: x.id,
          label: `${x.name} ${x.stream}`,
        }))}
        {...form.register("classId")}
      />
      <Select
        label="A-Level combination (optional)"
        options={[{ value: "", label: "—" }, ...combos.map((x) => ({ value: x.id, label: `${x.code} — ${x.name}` }))]}
        {...form.register("combinationId")}
      />
      {submitErr ? <Alert tone="error">{submitErr}</Alert> : null}
      <Button type="submit">Enrol student</Button>
    </form>
  );
}
