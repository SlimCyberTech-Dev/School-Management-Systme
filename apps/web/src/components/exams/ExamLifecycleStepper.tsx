"use client";

import type { ExamStatus } from "@uganda-cbc-sms/shared";

const STEPS: Array<{ key: ExamStatus; label: string; hint: string }> = [
  { key: "draft", label: "Plan", hint: "Configure class, subjects, and max score" },
  { key: "open", label: "Marking", hint: "Teachers enter and submit marks" },
  { key: "closed", label: "Complete", hint: "Results fixed; use for report cards" },
];

function stepIndex(status: ExamStatus) {
  return STEPS.findIndex((s) => s.key === status);
}

export function ExamLifecycleStepper({
  status,
  isArchived,
}: {
  status: ExamStatus;
  isArchived?: boolean;
}) {
  const current = stepIndex(status);

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      {isArchived ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Archived — not visible to teachers
        </p>
      ) : null}
      <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current && !isArchived;
          const upcoming = i > current;
          return (
            <li key={step.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  done ? "bg-emerald-600 text-white" : "",
                  active ? "bg-brand text-white ring-2 ring-brand/30" : "",
                  upcoming || isArchived ? "border border-border bg-card text-muted-foreground" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
