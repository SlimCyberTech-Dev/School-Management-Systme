"use client";

import type { AcademicYear, Term } from "@uganda-cbc-sms/shared";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcademicLevelScope } from "@/components/academic/AcademicLevelScope";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TimetablePublishedViewer } from "@/components/timetable/TimetablePublishedViewer";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useAcademicLevelScope } from "@/hooks/useAcademicLevelScope";
import { apiGet } from "@/lib/api";

type Props = {
  backHref?: string;
  emptyDescription?: string;
};

export function SchoolTimetableViewPage({
  backHref,
  emptyDescription = "No published timetable matches this year, term, and level. Contact the school administrator if you expected a schedule here.",
}: Props) {
  const { level, setLevel } = useAcademicLevelScope();
  const [yearId, setYearId] = useState("");
  const [termId, setTermId] = useState("");

  const yearsQ = useQuery({
    queryKey: ["years", "timetable-view"],
    queryFn: () => apiGet<AcademicYear[]>("/academic/years"),
  });
  const termsQ = useQuery({
    queryKey: ["terms", "timetable-view", yearId],
    queryFn: () => apiGet<Term[]>(`/academic/terms?academicYearId=${encodeURIComponent(yearId)}`),
    enabled: Boolean(yearId),
  });

  const years = useMemo(() => yearsQ.data ?? [], [yearsQ.data]);
  const terms = useMemo(
    () => (termsQ.data ?? []).filter((t) => !yearId || t.academicYearId === yearId),
    [termsQ.data, yearId],
  );

  useEffect(() => {
    if (!yearId && years.length) {
      const active = years.find((y) => y.isActive) ?? years[0];
      if (active) setYearId(active.id);
    }
  }, [years, yearId]);

  useEffect(() => {
    if (!termId && terms.length) {
      const active = terms.find((t) => t.isActive) ?? terms[0];
      if (active) setTermId(active.id);
    }
  }, [terms, termId]);

  const yearOptions = years.map((y) => ({
    value: y.id,
    label: y.name + (y.isActive ? " (active)" : ""),
  }));
  const termOptions = terms.map((t) => ({
    value: t.id,
    label: `Term ${t.termNumber}${t.isActive ? " (active)" : ""}`,
  }));

  return (
    <PageWrapper
      title="School timetable"
      description="Browse published teaching schedules by class or teacher across the school."
    >
      {backHref ? (
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">
          <Link href={backHref} className="font-medium text-brand hover:underline">
            ← Academic overview
          </Link>
        </p>
      ) : null}

      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Filter by academic year, term, and level (O-Level or A-Level). Switch between{" "}
        <strong className="font-medium text-foreground">By class</strong> and{" "}
        <strong className="font-medium text-foreground">By teacher</strong> to inspect the live published grid.
      </p>

      <div className="mb-4">
        <AcademicLevelScope level={level} onLevelChange={setLevel} />
      </div>

      <Card title="Scope">
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Academic year"
            options={yearOptions.length ? yearOptions : [{ value: "", label: "No years configured" }]}
            value={yearId}
            onChange={(e) => {
              setYearId(e.target.value);
              setTermId("");
            }}
          />
          <Select
            label="Term"
            options={termOptions.length ? termOptions : [{ value: "", label: "Select a year first" }]}
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
          />
        </div>
      </Card>

      <div className="mt-6">
        <TimetablePublishedViewer
          academicYearId={yearId}
          termId={termId}
          level={level}
          emptyDescription={emptyDescription}
        />
      </div>
    </PageWrapper>
  );
}
