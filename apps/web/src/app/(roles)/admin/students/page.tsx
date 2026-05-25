"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Student } from "@uganda-cbc-sms/shared";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/students/StudentTable";
import { Button } from "@/components/ui/Button";
import { apiGet } from "@/lib/api";
import { queryStatus } from "@/lib/queryStatus";

export default function AdminStudentsPage() {
  const studentsQ = useQuery({
    queryKey: ["students"],
    queryFn: () => apiGet<Student[]>("/students"),
  });

  const status = queryStatus(studentsQ, (d) => d.length === 0);

  return (
    <PageWrapper title="Students" description="Enrolled learners">
      <div className="mb-4 flex justify-end gap-2">
        <Link href="/admin/students/enrol">
          <Button>Enrol new student</Button>
        </Link>
      </div>
      <AsyncContent
        status={status}
        isFetching={studentsQ.isFetching && !studentsQ.isPending}
        loading={<StudentTable students={[]} loading profileBasePath="/admin/students" showEnrollmentActions />}
        error={
          <ErrorState
            message={studentsQ.error instanceof Error ? studentsQ.error.message : "Failed to load students"}
            onRetry={() => void studentsQ.refetch()}
          />
        }
      >
        <StudentTable
          students={studentsQ.data ?? []}
          profileBasePath="/admin/students"
          showEnrollmentActions
        />
      </AsyncContent>
    </PageWrapper>
  );
}
