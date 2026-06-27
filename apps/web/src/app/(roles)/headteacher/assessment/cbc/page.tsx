"use client";

import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CbcTermSummaryPanel } from "@/components/cbc/CbcTermSummaryPanel";
import { LegacyCbcDataSection } from "@/components/headteacher/LegacyCbcDataSection";
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
      title="Competency assessment"
      description="Review NCDC term competency summaries and apply headteacher overrides when needed."
    >
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        <Link href="/headteacher/assessment" className="font-medium text-brand hover:underline">
          ← Assessment hub
        </Link>
      </p>

      <CbcTermSummaryPanel variant="headteacher" />

      <LegacyCbcDataSection onUnlock={handleUnlock} />
    </PageWrapper>
  );
}
