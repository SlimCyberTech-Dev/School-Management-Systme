"use client";

import type { AcademicYear, SchoolClass, Term } from "@uganda-cbc-sms/shared";
import { Select } from "@/components/ui/Select";

export type HeadteacherPeriodValue = {
  yearId: string;
  termId: string;
  classId: string;
};

type Props = {
  years: AcademicYear[];
  terms: Term[];
  classes: SchoolClass[];
  value: HeadteacherPeriodValue;
  onChange: (next: Partial<HeadteacherPeriodValue>) => void;
};

export function HeadteacherPeriodFilters({ years, terms, classes, value, onChange }: Props) {
  const yearOpts = years.length
    ? years.map((y) => ({ value: y.id, label: y.name ?? y.id }))
    : [{ value: "", label: "No academic years" }];
  const termOpts = terms.length
    ? terms.map((t) => ({
        value: t.id,
        label: `Term ${t.termNumber ?? "?"}${t.isActive ? " (active)" : ""}`,
      }))
    : [{ value: "", label: "Select a year first" }];
  const classOpts = classes.length
    ? classes.map((c) => ({
        value: c.id,
        label: c.stream ? `${c.name} · ${c.stream}` : (c.name ?? c.id),
      }))
    : [{ value: "", label: "No classes for this year" }];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Select
        label="Academic year"
        options={yearOpts}
        value={value.yearId}
        onChange={(e) => onChange({ yearId: e.target.value, termId: "", classId: "" })}
      />
      <Select
        label="Term"
        options={termOpts}
        value={value.termId}
        onChange={(e) => onChange({ termId: e.target.value })}
      />
      <Select
        label="Class"
        options={classOpts}
        value={value.classId}
        onChange={(e) => onChange({ classId: e.target.value })}
      />
    </div>
  );
}
