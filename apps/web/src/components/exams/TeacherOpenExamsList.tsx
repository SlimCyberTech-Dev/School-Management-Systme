"use client";

import Link from "next/link";
import { ExamStatusBadge } from "@/components/exams/ExamStatusBadge";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TableSkeleton } from "@/components/feedback/TableSkeleton";
import { Table, type Column } from "@/components/ui/Table";
import { useOpenExams } from "@/hooks/useExams";
import type { ExamSummary } from "@uganda-cbc-sms/shared";
import { queryStatus } from "@/lib/queryStatus";

export function TeacherOpenExamsList({ basePath }: { basePath: string }) {
  const examsQ = useOpenExams();
  const status = queryStatus(examsQ, (d) => d.length === 0);

  const columns: Column<ExamSummary>[] = [
    {
      key: "name",
      header: "Exam",
      render: (r) => (
        <Link className="font-medium text-brand underline" href={`${basePath}/${r.id}`}>
          {r.name}
        </Link>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (r) => (
        <span>
          {r.className}
          {r.classStream ? ` · ${r.classStream}` : ""}
        </span>
      ),
    },
    { key: "date", header: "Date", render: (r) => r.examDate ?? "—" },
    { key: "max", header: "Max score", render: (r) => String(r.maxScore) },
    { key: "status", header: "Status", render: (r) => <ExamStatusBadge status={r.status} /> },
  ];

  return (
    <AsyncContent
      status={status}
      loading={<TableSkeleton rows={5} cols={4} />}
      error={
        <ErrorState
          message={examsQ.error instanceof Error ? examsQ.error.message : "We couldn't load open exams."}
          onRetry={() => void examsQ.refetch()}
        />
      }
      empty={
        <EmptyState
          title="No open exams"
          description="When an administrator opens an exam for your class subjects, it will appear here."
        />
      }
    >
      <Table
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        rows={(examsQ.data ?? []) as unknown as Record<string, unknown>[]}
      />
    </AsyncContent>
  );
}
