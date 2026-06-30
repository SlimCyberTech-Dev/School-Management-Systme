"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Student } from "@uganda-cbc-sms/shared";
import { ProjectWorkGrid } from "@/components/assessment/ProjectWorkGrid";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { Alert } from "@/components/ui/Alert";
import { apiGet } from "@/lib/api";
import { manualStatus } from "@/lib/queryStatus";

function roleBase(pathname: string): "/class-teacher" | "/subject-teacher" {
  return pathname.includes("/class-teacher/") ? "/class-teacher" : "/subject-teacher";
}

export function TeacherProjectWorkEntryPanel() {
  const pathname = usePathname();
  const listHref = `${roleBase(pathname)}/assessment/project-work`;
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId") ?? "";
  const subjectId = searchParams.get("subjectId") ?? "";
  const termId = searchParams.get("termId") ?? "";
  const yearId = searchParams.get("yearId") ?? "";
  const contextReady = Boolean(classId && subjectId && termId && yearId);

  const studentsQ = useQuery({
    queryKey: ["students", classId],
    queryFn: () => apiGet<Student[]>(`/students?classId=${encodeURIComponent(classId)}`),
    enabled: contextReady,
  });

  const students = useMemo(
    () =>
      (studentsQ.data ?? []).map((s) => ({
        id: s.id,
        fullName: s.fullName,
        studentNumber: s.studentNumber,
      })),
    [studentsQ.data],
  );

  const status = manualStatus({
    loading: studentsQ.isPending,
    error: studentsQ.error,
    data: students,
  });

  if (!contextReady) {
    return (
      <Alert tone="info">
        Choose a class and subject from{" "}
        <Link href={listHref} className="font-medium text-brand underline">
          your assignments
        </Link>{" "}
        to enter project work scores.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Link href={listHref} className="inline-block text-sm font-medium text-brand hover:underline">
        ← My assignments
      </Link>
      <AsyncContent
        status={status}
        loading={<FormSkeleton fields={4} />}
        error={<ErrorState message="Could not load students." onRetry={() => void studentsQ.refetch()} />}
      >
        {students.length === 0 ? (
          <Alert tone="info">No students are enrolled in this class.</Alert>
        ) : (
          <ProjectWorkGrid
            classId={classId}
            subjectId={subjectId}
            termId={termId}
            yearId={yearId}
            students={students}
          />
        )}
      </AsyncContent>
    </div>
  );
}
