"use client";

import type { ExamMarkingProgress, ExamStatus } from "@uganda-cbc-sms/shared";

export function ExamMarkingProgressCard({
  progress,
  status,
}: {
  progress: ExamMarkingProgress;
  status: ExamStatus;
}) {
  const subjectPct =
    progress.totalSubjects > 0
      ? Math.round((progress.submittedSubjects / progress.totalSubjects) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subjects submitted</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {progress.submittedSubjects}
          <span className="text-lg font-normal text-muted-foreground"> / {progress.totalSubjects}</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${subjectPct}%` }}
          />
        </div>
        {progress.pendingSubjects > 0 && status === "open" ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            {progress.pendingSubjects} subject(s) awaiting teacher submission
          </p>
        ) : null}
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active students</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{progress.activeStudents}</p>
        <p className="mt-1 text-xs text-muted-foreground">In this exam&apos;s class</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mark rows saved</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{progress.marksEntered}</p>
        <p className="mt-1 text-xs text-muted-foreground">Student × subject entries in the database</p>
      </div>
    </div>
  );
}
