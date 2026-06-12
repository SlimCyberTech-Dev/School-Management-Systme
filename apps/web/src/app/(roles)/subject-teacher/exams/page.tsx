"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherExamsPageContent } from "@/components/exams/TeacherExamsPageContent";

export default function SubjectTeacherExamsPage() {
  return (
    <PageWrapper
      title="Open exams"
      description="Formal exam papers you teach — O-Level and A-Level each use their own grading scale."
    >
      <TeacherExamsPageContent roleBase="/subject-teacher" />
    </PageWrapper>
  );
}
