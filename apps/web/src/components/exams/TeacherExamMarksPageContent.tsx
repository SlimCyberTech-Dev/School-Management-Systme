"use client";

import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherExamMarksPanel } from "@/components/exams/TeacherExamMarksPanel";
import { useExam } from "@/hooks/useExams";
import { levelLabel, parseAcademicLevel } from "@/lib/academicLevel";

export function TeacherExamMarksPageContent({
  examId,
  roleBase,
}: {
  examId: string;
  roleBase: "/subject-teacher" | "/class-teacher";
}) {
  const examQ = useExam(examId);
  const level = parseAcademicLevel(examQ.data?.classLevel);

  return (
    <PageWrapper
      title={examQ.data?.name ?? "Enter exam marks"}
      description={`Formal exam paper — ${levelLabel(level)} grading scale. Save progress, then submit to lock your subject.`}
    >
      <Link
        href={`${roleBase}/exams`}
        className="mb-4 inline-block text-sm font-medium text-brand hover:underline"
      >
        ← Open exams
      </Link>
      <TeacherExamMarksPanel examId={examId} roleBase={roleBase} />
    </PageWrapper>
  );
}
