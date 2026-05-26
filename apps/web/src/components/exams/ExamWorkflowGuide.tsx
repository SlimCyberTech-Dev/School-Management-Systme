"use client";

export function ExamWorkflowGuide() {
  return (
    <div className="rounded-lg border border-border bg-gradient-to-br from-brand/5 to-transparent p-4 text-sm">
      <p className="font-semibold text-foreground">Formal exam workflow</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>
          <span className="text-foreground">Create draft</span> — set class, term, subjects, and maximum score.
        </li>
        <li>
          <span className="text-foreground">Open for marking</span> — assigned subject teachers enter scores and submit
          per subject.
        </li>
        <li>
          <span className="text-foreground">Close exam</span> — when all subjects are submitted (or force-close if
          agreed).
        </li>
        <li>
          <span className="text-foreground">Report cards</span> — link this exam when generating reports, or use term
          assessments only.
        </li>
        <li>
          <span className="text-foreground">Archive</span> when retired; <span className="text-foreground">permanent delete</span>{" "}
          only for archived exams or unused drafts (irreversible).
        </li>
      </ol>
    </div>
  );
}
