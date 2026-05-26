"use client";

import Link from "next/link";
import type { ExamSummary } from "@uganda-cbc-sms/shared";
import { Button } from "@/components/ui/Button";

type Props = {
  exam: ExamSummary;
  onEdit: (exam: ExamSummary) => void;
  onArchive: (exam: ExamSummary) => void;
  onOpen: (exam: ExamSummary) => void;
  onClose: (exam: ExamSummary) => void;
  onReopen: (exam: ExamSummary) => void;
  busy?: boolean;
  archivedView?: boolean;
};

export function AdminExamRowActions({
  exam,
  onEdit,
  onArchive,
  onOpen,
  onClose,
  onReopen,
  busy,
  archivedView,
}: Props) {
  if (archivedView || exam.isArchived) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link className="text-sm font-medium text-brand underline" href={`/admin/exams/${exam.id}?archived=1`}>
          View archive
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link className="text-sm font-medium text-brand underline" href={`/admin/exams/${exam.id}`}>
        Manage
      </Link>
      {exam.status === "draft" ? (
        <>
          <Button type="button" variant="secondary" className="!px-2 !py-1 text-xs" disabled={busy} onClick={() => onEdit(exam)}>
            Edit
          </Button>
          <Button type="button" className="!px-2 !py-1 text-xs" disabled={busy} onClick={() => onOpen(exam)}>
            Open
          </Button>
        </>
      ) : null}
      {exam.status === "open" ? (
        <Button type="button" variant="secondary" className="!px-2 !py-1 text-xs" disabled={busy} onClick={() => onClose(exam)}>
          Close
        </Button>
      ) : null}
      {exam.status === "closed" ? (
        <Button type="button" className="!px-2 !py-1 text-xs" disabled={busy} onClick={() => onReopen(exam)}>
          Reopen
        </Button>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        className="!px-2 !py-1 text-xs text-amber-800 dark:text-amber-300"
        disabled={busy}
        onClick={() => onArchive(exam)}
      >
        Archive
      </Button>
    </div>
  );
}
