"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherOpenExamsList } from "@/components/exams/TeacherOpenExamsList";

export default function ClassTeacherExamsPage() {
  return (
    <PageWrapper
      title="Open exams"
      description="Enter marks for exams opened for your class or assigned subjects."
    >
      <TeacherOpenExamsList basePath="/class-teacher/exams" />
    </PageWrapper>
  );
}
