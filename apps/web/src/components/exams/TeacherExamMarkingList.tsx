"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TableSkeleton } from "@/components/feedback/TableSkeleton";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { useExamMarkingSlots, type ExamMarkingSlot } from "@/hooks/useExams";
import { levelShortLabel, parseAcademicLevel, type AcademicLevel } from "@/lib/academicLevel";
import { queryStatus } from "@/lib/queryStatus";

type LevelFilter = "all" | AcademicLevel;

export function TeacherExamMarkingList({ basePath }: { basePath: string }) {
  const slotsQ = useExamMarkingSlots();
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const filtered = useMemo(() => {
    const rows = slotsQ.data ?? [];
    if (levelFilter === "all") return rows;
    return rows.filter((r) => parseAcademicLevel(r.classLevel) === levelFilter);
  }, [slotsQ.data, levelFilter]);

  const status = queryStatus(slotsQ, (d) => d.length === 0);

  const columns: Column<ExamMarkingSlot>[] = [
    {
      key: "subject",
      header: "Your subject",
      render: (r) => (
        <div>
          <div className="font-medium">
            {r.subjectCode} — {r.subjectName}
          </div>
          <div className="text-xs text-muted-foreground">{r.examName}</div>
        </div>
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
    {
      key: "level",
      header: "Level",
      render: (r) => (
        <Badge tone={parseAcademicLevel(r.classLevel) === "A_LEVEL" ? "warning" : "neutral"}>
          {levelShortLabel(parseAcademicLevel(r.classLevel))}
        </Badge>
      ),
    },
    { key: "date", header: "Exam date", render: (r) => r.examDate ?? "—" },
    { key: "max", header: "Max", render: (r) => String(r.maxScore) },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge tone={r.isSubmitted ? "success" : r.canEdit ? "warning" : "neutral"}>
          {r.isSubmitted ? "Submitted" : r.canEdit ? "Enter marks" : "View only"}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Link
          className="text-sm font-medium text-brand underline"
          href={`${basePath}/${r.examId}?subjectId=${encodeURIComponent(r.subjectId)}`}
        >
          {r.isSubmitted ? "View" : "Enter marks"}
        </Link>
      ),
    },
  ];

  const allRows = slotsQ.data ?? [];
  const oCount = allRows.filter((r) => parseAcademicLevel(r.classLevel) === "O_LEVEL").length;
  const aCount = allRows.filter((r) => parseAcademicLevel(r.classLevel) === "A_LEVEL").length;

  return (
    <div className="space-y-4">
      {allRows.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Filter by level"
            className="min-w-[10rem]"
            options={[
              { value: "all", label: `All (${allRows.length})` },
              { value: "O_LEVEL", label: `O-Level (${oCount})` },
              { value: "A_LEVEL", label: `A-Level (${aCount})` },
            ]}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
          />
        </div>
      ) : null}

      <AsyncContent
        status={status}
        loading={<TableSkeleton rows={6} cols={6} />}
        error={
          <ErrorState
            message={
              slotsQ.error instanceof Error
                ? slotsQ.error.message
                : "We couldn't load your exam marking tasks."
            }
            onRetry={() => void slotsQ.refetch()}
          />
        }
        empty={
          <EmptyState
            title="No open exams for your subjects"
            description="When an administrator opens a formal exam and you are the assigned subject teacher on the class timetable, your papers appear here. O-Level and A-Level papers each use their own grading scale when you enter marks."
          />
        }
      >
        {filtered.length === 0 && allRows.length > 0 ? (
          <EmptyState
            title="No papers at this level"
            description="Try another level filter or check back when an administrator opens an exam for your class."
          />
        ) : (
          <Table
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            rows={filtered as unknown as Record<string, unknown>[]}
          />
        )}
      </AsyncContent>
    </div>
  );
}
