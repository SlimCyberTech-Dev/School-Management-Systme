"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function TeacherAssessmentScopeNote({
  track,
  roleBase,
  openExamCount,
}: {
  track: "alevel" | "project-work";
  roleBase: "/subject-teacher" | "/class-teacher";
  openExamCount?: number;
}) {
  if (track === "project-work") {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          Enter <strong className="text-foreground">project work scores</strong> for official continuous assessment.
          When your school enables project work in term grades, these scores are blended with compulsory exam averages.
          Exam marks are entered under{" "}
          <Link href={`${roleBase}/exams`} className="font-medium text-brand hover:underline">
            Exams
          </Link>
          .
        </p>
      </Card>
    );
  }

  if (track === "alevel") {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          Enter <strong className="text-foreground">term UNEB scores</strong> (0–100) only for subjects explicitly
          assigned to you on Subject teachers. Homeroom alone does not appear here. Formal exams use the same scores
          when linked to report cards — open exam marking is under{" "}
          <Link href={`${roleBase}/exams`} className="font-medium text-brand hover:underline">
            Exams
          </Link>
          .
        </p>
      </Card>
    );
  }

  return null;
}
