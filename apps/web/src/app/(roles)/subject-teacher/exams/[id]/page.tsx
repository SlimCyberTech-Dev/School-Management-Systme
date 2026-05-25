"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherExamMarksPanel } from "@/components/exams/TeacherExamMarksPanel";
import { useExam } from "@/hooks/useExams";

export default function SubjectTeacherExamMarksPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const examQ = useExam(id);

  return (
    <PageWrapper title={examQ.data?.name ?? "Enter marks"} description="Save progress, then submit to lock your subject">
      <Link href="/subject-teacher/exams" className="mb-4 inline-block text-sm font-medium text-brand hover:underline">
        ← Open exams
      </Link>
      <TeacherExamMarksPanel examId={id} />
    </PageWrapper>
  );
}
