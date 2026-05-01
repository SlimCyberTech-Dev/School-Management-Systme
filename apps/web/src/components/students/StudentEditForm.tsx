"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Student } from "@uganda-cbc-sms/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiGet, apiPatch } from "@/lib/api";

type ClassOpt = { id: string; name: string; stream: string };
type ComboOpt = { id: string; code: string; name: string };

type EditValues = {
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  guardianName: string;
  guardianContact: string;
  guardianEmail: string;
  address: string;
  previousSchool: string;
  classId: string;
  combinationId: string;
  status: "active" | "transferred" | "withdrawn";
  transferReason: string;
};

function studentToDefaults(st: Student): EditValues {
  return {
    fullName: st.fullName,
    dateOfBirth: st.dateOfBirth,
    gender: st.gender,
    guardianName: st.guardianName,
    guardianContact: st.guardianContact,
    guardianEmail: st.guardianEmail ?? "",
    address: st.address ?? "",
    previousSchool: st.previousSchool ?? "",
    classId: st.classId ?? "",
    combinationId: st.combinationId ?? "",
    status: st.status,
    transferReason: st.transferReason ?? "",
  };
}

export function StudentEditForm({ studentId, initial }: { studentId: string; initial: Student }) {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOpt[]>([]);
  const [combos, setCombos] = useState<ComboOpt[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const form = useForm<EditValues>({ defaultValues: studentToDefaults(initial) });

  useEffect(() => {
    void (async () => {
      try {
        const [c, k] = await Promise.all([
          apiGet<ClassOpt[]>("/academic/classes"),
          apiGet<ComboOpt[]>("/academic/combinations"),
        ]);
        setClasses(c);
        setCombos(k);
      } catch (e) {
        setLoadErr(e instanceof Error ? e.message : "Failed to load lookups");
      }
    })();
  }, []);

  const onSubmit = async (values: EditValues) => {
    setSubmitErr(null);
    try {
      await apiPatch<Student>(`/students/${encodeURIComponent(studentId)}`, {
        fullName: values.fullName.trim(),
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        guardianName: values.guardianName.trim(),
        guardianContact: values.guardianContact.trim(),
        guardianEmail: values.guardianEmail.trim() || null,
        address: values.address.trim() || null,
        previousSchool: values.previousSchool.trim() || null,
        classId: values.classId.trim() || null,
        combinationId: values.combinationId.trim() || null,
        status: values.status,
        transferReason: values.transferReason.trim() || null,
      });
      router.push(`/admin/students/${studentId}`);
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <form className="max-w-xl space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      {loadErr ? <p className="text-sm text-red-600">{loadErr}</p> : null}
      <Input label="Full name" {...form.register("fullName", { required: true })} />
      <Input label="Date of birth" type="date" {...form.register("dateOfBirth", { required: true })} />
      <Select
        label="Gender"
        options={[
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
        ]}
        {...form.register("gender", { required: true })}
      />
      <Input label="Guardian name" {...form.register("guardianName", { required: true })} />
      <Input label="Guardian contact" {...form.register("guardianContact", { required: true })} />
      <Input label="Guardian email (optional)" type="email" {...form.register("guardianEmail")} />
      <div className="w-full">
        <label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">
          Address (optional)
        </label>
        <textarea
          id="address"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          {...form.register("address")}
        />
      </div>
      <Input label="Previous school (optional)" {...form.register("previousSchool")} />
      <Select
        label="Class"
        options={[
          { value: "", label: "Select class…" },
          ...classes.map((x) => ({
            value: x.id,
            label: `${x.name} ${x.stream}`,
          })),
        ]}
        {...form.register("classId", {
          validate: (v) => (v?.trim() ? true : "Choose a class"),
        })}
        error={form.formState.errors.classId?.message}
      />
      <Select
        label="A-Level combination (optional)"
        options={[{ value: "", label: "—" }, ...combos.map((x) => ({ value: x.id, label: `${x.code} — ${x.name}` }))]}
        {...form.register("combinationId")}
      />
      <Select
        label="Enrollment status"
        options={[
          { value: "active", label: "Active" },
          { value: "transferred", label: "Transferred" },
          { value: "withdrawn", label: "Withdrawn" },
        ]}
        {...form.register("status", { required: true })}
      />
      <div className="w-full">
        <label htmlFor="transferReason" className="mb-1 block text-sm font-medium text-slate-700">
          Transfer / withdrawal notes (optional)
        </label>
        <textarea
          id="transferReason"
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          {...form.register("transferReason")}
        />
      </div>
      {submitErr ? <p className="text-sm text-red-600">{submitErr}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Save changes</Button>
        <Button type="button" variant="secondary" onClick={() => router.push(`/admin/students/${studentId}`)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
