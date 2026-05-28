"use client";

import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeadteacherAssessmentStatusPanel } from "@/components/headteacher/HeadteacherAssessmentStatusPanel";

export default function HeadteacherAlevelAssessmentPage() {
  return (
    <PageWrapper title="A-Level assessments" description="Term score submission status by subject">
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        <Link href="/headteacher/assessment" className="font-medium text-brand hover:underline">
          ← Assessment hub
        </Link>
      </p>
      <HeadteacherAssessmentStatusPanel
        track="alevel"
        title="A-Level subject progress"
        description="Monitor which subjects have submitted term scores. Teachers edit marks on their class portals until submission."
        statusPath="/assessments/alevel/status"
      />
    </PageWrapper>
  );
}
