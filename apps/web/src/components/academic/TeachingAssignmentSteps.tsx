"use client";

import Link from "next/link";
import type { AcademicLevel } from "@/lib/academicLevel";
import { levelShortLabel } from "@/lib/academicLevel";
import { Card } from "@/components/ui/Card";

type Step = {
  n: number;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export function TeachingAssignmentSteps({
  level,
  yearId,
  hrefWithLevel,
  academicBasePath = "/admin/academic",
}: {
  level: AcademicLevel;
  yearId: string;
  hrefWithLevel: (path: string, extra?: Record<string, string>) => string;
  academicBasePath?: string;
}) {
  const track = levelShortLabel(level);
  const yearQ = yearId ? { academicYearId: yearId } : undefined;
  const step = (segment: string) => hrefWithLevel(`${academicBasePath}${segment}`, yearQ);

  const steps: Step[] = [
    {
      n: 1,
      title: "Class teachers (homeroom)",
      body: `Assign homeroom and class teachers for each ${track} class. Homeroom does not auto-grant subject marks — assign subjects on step 3.`,
      href: step("/class-teachers"),
      cta: "Class teachers",
    },
    {
      n: 2,
      title: "Subjects on the timetable",
      body: `Add which ${track} subjects each class offers — or use Structure setup and Curriculum setup to auto-provision years, classes, and subjects.`,
      href: step("/class-subjects"),
      cta: "Manage class subjects",
    },
    {
      n: 3,
      title: "Subject teachers",
      body: `Set teachable subjects and allocate staff to each ${track} class–subject slot. Required for marks, exams, and timetable — including homeroom teachers.`,
      href: step("/teacher-assignments"),
      cta: "Subject teachers",
    },
    {
      n: 4,
      title: "Weekly timetable",
      body: `Schedule when each ${track} class–subject slot occurs (periods and days). Publish for teachers.`,
      href: step("/timetable"),
      cta: "Timetable builder",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((s) => (
        <Card key={s.n}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {s.n}</p>
          <h3 className="mt-1 font-semibold text-foreground">{s.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          <Link
            href={s.href}
            className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
          >
            {s.cta} →
          </Link>
        </Card>
      ))}
    </div>
  );
}
