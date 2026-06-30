"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { SubjectTeacherDashboardContent } from "@/components/subject-teacher/SubjectTeacherDashboardContent";
import { DashboardSkeleton } from "@/components/layout/shells/DashboardScaffold";
import { useExamMarkingSlots } from "@/hooks/useExams";
import { useMyTeachingScope } from "@/hooks/useMyTeachingScope";
import { apiGet } from "@/lib/api";
import { manualStatus } from "@/lib/queryStatus";
import type { PaginatedStudents } from "@uganda-cbc-sms/shared";

export default function SubjectTeacherDashboardPage() {
  const scope = useMyTeachingScope();
  const previewClassId = scope.primarySubjectClassId;
  const previewSlot = scope.subjectSlots[0] ?? null;

  const studentsQ = useQuery({
    queryKey: ["subject-teacher-dashboard-students", previewClassId],
    queryFn: () =>
      apiGet<PaginatedStudents>(
        `/students?classId=${encodeURIComponent(previewClassId!)}&status=active&limit=10&page=1&sort=name`,
      ),
    enabled: Boolean(previewClassId),
  });

  const examSlotsQ = useExamMarkingSlots();
  const examSlots = examSlotsQ.data ?? [];
  const examSlotTotal = examSlots.length;
  const examSlotSubmitted = examSlots.filter((s) => s.isSubmitted).length;
  const examSlotPending = examSlotTotal - examSlotSubmitted;

  const uniqueClassCount = useMemo(() => {
    const ids = new Set(scope.subjectSlots.map((s) => s.classId));
    return ids.size;
  }, [scope.subjectSlots]);

  const students = useMemo(() => studentsQ.data?.items ?? [], [studentsQ.data?.items]);
  const termLabel = scope.termId ? `Term ${scope.activeTerm?.termNumber ?? ""}` : "Not set";

  const loadStudents = Boolean(previewClassId);
  const loadExamSlots = Boolean(scope.subjectSlots.length > 0);

  const status = manualStatus({
    loading:
      scope.isLoading ||
      (loadStudents && studentsQ.isPending) ||
      (loadExamSlots && examSlotsQ.isPending),
    error: scope.error ?? studentsQ.error ?? examSlotsQ.error,
    data: scope.hasAssignments ? scope.subjectSlots : scope.myClasses,
  });

  const isFetching =
    scope.isLoading ||
    (loadStudents && studentsQ.isFetching) ||
    (loadExamSlots && examSlotsQ.isFetching);

  const errorMessage =
    (scope.error ?? studentsQ.error ?? examSlotsQ.error) instanceof Error
      ? (scope.error ?? studentsQ.error ?? examSlotsQ.error)!.message
      : "Failed to load";

  const studentPreviews = useMemo(
    () =>
      students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        studentNumber: s.studentNumber,
      })),
    [students],
  );

  return (
    <AsyncContent
      status={status}
      isFetching={isFetching}
      loading={<DashboardSkeleton />}
      error={<ErrorState message={errorMessage} onRetry={() => void scope.refetch()} />}
    >
      <SubjectTeacherDashboardContent
        previewSlot={previewSlot}
        yearName={scope.activeYear?.name}
        termLabel={termLabel}
        subjectSlotCount={scope.subjectSlots.length}
        uniqueClassCount={uniqueClassCount}
        examSlotTotal={examSlotTotal}
        examSlotSubmitted={examSlotSubmitted}
        examSlotPending={examSlotPending}
        students={studentPreviews}
        studentsTotal={studentsQ.data?.total}
        myClasses={scope.myClasses}
        subjectSlots={scope.subjectSlots}
        homeroomClasses={scope.homeroomClasses}
      />
    </AsyncContent>
  );
}
