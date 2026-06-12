"use client";

import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeadteacherAssessmentStatusPanel } from "@/components/headteacher/HeadteacherAssessmentStatusPanel";
import type { HeadteacherPeriodValue } from "@/components/headteacher/HeadteacherPeriodFilters";
import { useCbcActions } from "@/hooks/useCBCAssessment";

export default function HeadteacherCbcAssessmentPage() {
  const { unlock } = useCbcActions();

  const handleUnlock = async (subjectId: string, filters: HeadteacherPeriodValue) => {
    await unlock.mutateAsync({
      subjectId,
      classId: filters.classId,
      termId: filters.termId,
      yearId: filters.yearId,
    });
  };

  return (
    <PageWrapper
      title="CBC assessments"
      description="O-Level competency ratings — submission status and unlock"
    >
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        <Link href="/headteacher/assessment" className="font-medium text-brand hover:underline">
          ← Assessment hub
        </Link>
      </p>
      <HeadteacherAssessmentStatusPanel
        track="cbc"
        title="CBC subject progress"
        description="Each subject teacher submits strand ratings for their class. Unlock only when you approve corrections to a locked sheet."
        statusPath="/assessments/cbc/status"
        canUnlock
        onUnlock={handleUnlock}
      />
    </PageWrapper>
  );
}
