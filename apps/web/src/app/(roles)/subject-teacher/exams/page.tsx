"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherOpenExamsList } from "@/components/exams/TeacherOpenExamsList";

export default function SubjectTeacherExamsPage() {
  return (
    <PageWrapper
      title="Open exams"
      description="Enter marks for exams your administrator has opened for your subjects."
    >
      <TeacherOpenExamsList basePath="/subject-teacher/exams" />
    </PageWrapper>
  );
}
