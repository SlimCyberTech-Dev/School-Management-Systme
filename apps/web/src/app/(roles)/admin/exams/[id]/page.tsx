"use client";

import { SchoolExamDetailPage } from "@/components/exams/SchoolExamDetailPage";

export default function AdminExamDetailPage() {
  return <SchoolExamDetailPage examsBasePath="/admin/exams" reportsBasePath="/admin/reports" />;
}
