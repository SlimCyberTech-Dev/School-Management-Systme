"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherCbcEntryPanel } from "@/components/assessment/TeacherCbcEntryPanel";

export default function SubjectTeacherCbcEntryPage() {
  return (
    <PageWrapper title="CBC score entry" description="Enter A–E ratings per competency, then submit to lock">
      <TeacherCbcEntryPanel />
    </PageWrapper>
  );
}
