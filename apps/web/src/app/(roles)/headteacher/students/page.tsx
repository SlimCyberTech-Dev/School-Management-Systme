"use client";

import { useQuery } from "@tanstack/react-query";
import type { Student } from "@uganda-cbc-sms/shared";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/students/StudentTable";
import { apiGet } from "@/lib/api";
import { queryStatus } from "@/lib/queryStatus";

export default function HeadteacherStudentsPage() {
  const studentsQ = useQuery({
    queryKey: ["students"],
    queryFn: () => apiGet<Student[]>("/students"),
  });

  const status = queryStatus(studentsQ, (d) => d.length === 0);

  return (
    <PageWrapper title="Students" description="School enrolment">
      <AsyncContent
        status={status}
        isFetching={studentsQ.isFetching && !studentsQ.isPending}
        loading={<StudentTable students={[]} loading profileBasePath="/headteacher/students" />}
        error={
          <ErrorState
            message={studentsQ.error instanceof Error ? studentsQ.error.message : "Failed to load students"}
            onRetry={() => void studentsQ.refetch()}
          />
        }
      >
        <StudentTable students={studentsQ.data ?? []} profileBasePath="/headteacher/students" />
      </AsyncContent>
    </PageWrapper>
  );
}
