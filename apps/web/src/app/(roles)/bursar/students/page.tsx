"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentsDirectory } from "@/components/students/StudentsDirectory";

export default function BursarStudentsPage() {
  return (
    <PageWrapper
      title="Students"
      description="Search learners to view balances, invoices, and record payments."
    >
      <StudentsDirectory profileBasePath="/bursar/students" />
    </PageWrapper>
  );
}
