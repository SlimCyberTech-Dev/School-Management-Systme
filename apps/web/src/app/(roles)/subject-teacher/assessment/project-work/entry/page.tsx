"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherProjectWorkEntryPanel } from "@/components/assessment/TeacherProjectWorkEntryPanel";

export default function SubjectTeacherProjectWorkEntryPage() {
  return (
    <PageWrapper
      title="Project work entry"
      description="Enter scored project work per learner for this class and subject."
    >
      <TeacherProjectWorkEntryPanel />
    </PageWrapper>
  );
}
