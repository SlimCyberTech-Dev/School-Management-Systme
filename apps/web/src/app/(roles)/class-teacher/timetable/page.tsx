"use client";

import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherTimetableSkeleton } from "@/components/timetable/TeacherTimetableSkeleton";
import { TeacherWeekTimetable } from "@/components/timetable/TeacherWeekTimetable";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useTeacherWeek } from "@/hooks/useTimetable";
import { queryStatus } from "@/lib/queryStatus";

export default function ClassTeacherTimetablePage() {
  const [weekStart, setWeekStart] = useState<string | undefined>(undefined);
  const weekQ = useTeacherWeek(weekStart);
  const status = queryStatus(weekQ);

  return (
    <PageWrapper
      title="My timetable"
      description="Your published teaching schedule — times, classes, and attendance for each lesson."
    >
      <AsyncContent
        status={status}
        loading={<TeacherTimetableSkeleton />}
        error={
          <ErrorState
            message={weekQ.error instanceof Error ? weekQ.error.message : "Failed to load timetable"}
            onRetry={() => void weekQ.refetch()}
          />
        }
      >
        <TeacherWeekTimetable
          week={weekQ.data}
          weekStart={weekStart}
          onWeekStartChange={setWeekStart}
          onRefresh={() => void weekQ.refetch()}
          isFetching={weekQ.isFetching}
        />
      </AsyncContent>
    </PageWrapper>
  );
}
