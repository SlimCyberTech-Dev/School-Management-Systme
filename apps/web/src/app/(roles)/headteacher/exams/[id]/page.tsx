"use client";

import { SchoolExamDetailPage } from "@/components/exams/SchoolExamDetailPage";

export default function HeadteacherExamDetailPage() {
  return (
    <SchoolExamDetailPage examsBasePath="/headteacher/exams" reportsBasePath="/headteacher/reports" />
  );
}
