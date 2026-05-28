"use client";

import { SchoolExamsPage } from "@/components/exams/SchoolExamsPage";

export default function HeadteacherExamsPage() {
  return <SchoolExamsPage examsBasePath="/headteacher/exams" hubHref="/headteacher/assessment" />;
}
