"use client";

import { useParams } from "next/navigation";
import { TeacherExamMarksPageContent } from "@/components/exams/TeacherExamMarksPageContent";

export default function SubjectTeacherExamMarksPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  return <TeacherExamMarksPageContent examId={id} roleBase="/subject-teacher" />;
}
