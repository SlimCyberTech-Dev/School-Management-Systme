"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AcademicYear, Term } from "@uganda-cbc-sms/shared";
import { apiGet } from "@/lib/api";
import { classDisplayName } from "@/lib/academicLevel";

export type MyClassRow = {
  classId: string;
  className: string;
  classStream: string;
  level: string;
  academicYearId: string;
  academicYearName: string;
  isHomeroom: boolean;
  studentCount: number;
};

export type MySubjectSlotRow = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  className: string;
  classStream: string;
  classLevel: string;
};

type AssignedApiRow = {
  classId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  className?: string;
  classStream?: string | null;
  classLevel?: string;
};

export function useMyTeachingScope() {
  const yearsQ = useQuery({
    queryKey: ["academic-years", "teaching-scope"],
    queryFn: () => apiGet<AcademicYear[]>("/academic/years"),
  });

  const activeYear = useMemo(
    () => yearsQ.data?.find((y) => y.isActive) ?? yearsQ.data?.[0] ?? null,
    [yearsQ.data],
  );

  const yearId = activeYear?.id ?? "";

  const termsQ = useQuery({
    queryKey: ["academic-terms", "teaching-scope", yearId],
    queryFn: () => apiGet<Term[]>(`/academic/terms?academicYearId=${encodeURIComponent(yearId)}`),
    enabled: Boolean(yearId),
  });

  const activeTerm = useMemo(
    () => termsQ.data?.find((t) => t.isActive) ?? termsQ.data?.[0] ?? null,
    [termsQ.data],
  );

  const myClassesQ = useQuery({
    queryKey: ["my-classes", yearId],
    queryFn: () => {
      const q = yearId ? `?academicYearId=${encodeURIComponent(yearId)}` : "";
      return apiGet<MyClassRow[]>(`/academic/my-classes${q}`);
    },
    enabled: Boolean(yearId),
  });

  const subjectSlotsQ = useQuery({
    queryKey: ["subjects-assigned", yearId, activeTerm?.id],
    queryFn: () => {
      const qp = new URLSearchParams();
      if (yearId) qp.set("yearId", yearId);
      if (activeTerm?.id) qp.set("termId", activeTerm.id);
      const q = qp.toString();
      return apiGet<AssignedApiRow[]>(`/assessments/subjects-assigned${q ? `?${q}` : ""}`);
    },
    enabled: Boolean(yearId),
  });

  const myClasses = myClassesQ.data ?? [];

  const subjectSlots: MySubjectSlotRow[] = useMemo(
    () =>
      (subjectSlotsQ.data ?? []).map((r) => ({
        subjectId: r.subjectId,
        subjectName: r.subjectName,
        subjectCode: r.subjectCode,
        classId: r.classId,
        className: r.className ?? "Class",
        classStream: r.classStream ?? "",
        classLevel: r.classLevel ?? "",
      })),
    [subjectSlotsQ.data],
  );

  const homeroomClasses = useMemo(() => myClasses.filter((c) => c.isHomeroom), [myClasses]);

  const primaryHomeroom = homeroomClasses[0] ?? null;

  /** Class used for homeroom duties (attendance, class list). */
  const homeroomClass = primaryHomeroom;

  /** First class for subject-work preview (first assigned slot, else first class). */
  const primarySubjectClassId = subjectSlots[0]?.classId ?? myClasses[0]?.classId ?? null;

  const uniqueClassCount = useMemo(() => {
    const ids = new Set<string>();
    for (const c of myClasses) ids.add(c.classId);
    for (const s of subjectSlots) ids.add(s.classId);
    return ids.size;
  }, [myClasses, subjectSlots]);

  const classLabel = (c: Pick<MyClassRow, "className" | "classStream">) =>
    classDisplayName({ name: c.className, stream: c.classStream });

  const hasAssignments = myClasses.length > 0 || subjectSlots.length > 0;

  /** Best class for roster / attendance on dashboards when homeroom is not set. */
  const primaryDashboardClassId = homeroomClass?.classId ?? primarySubjectClassId;

  return {
    activeYear,
    activeTerm,
    yearId,
    termId: activeTerm?.id ?? "",
    myClasses,
    subjectSlots,
    homeroomClasses,
    homeroomClass,
    primarySubjectClassId,
    primaryDashboardClassId,
    uniqueClassCount,
    hasAssignments,
    classLabel,
    isLoading: yearsQ.isLoading || myClassesQ.isLoading || subjectSlotsQ.isLoading,
    isError: yearsQ.isError || myClassesQ.isError || subjectSlotsQ.isError,
    error: yearsQ.error ?? myClassesQ.error ?? subjectSlotsQ.error,
    refetch: async () => {
      await Promise.all([yearsQ.refetch(), myClassesQ.refetch(), subjectSlotsQ.refetch(), termsQ.refetch()]);
    },
  };
}
