"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { MyClassRow, MySubjectSlotRow } from "@/hooks/useMyTeachingScope";
import { classDisplayName } from "@/lib/academicLevel";

export function TeacherTeachingScopeCard({
  myClasses,
  subjectSlots,
  homeroomClasses,
  academicYearName,
  classTeachersHref = "/admin/academic/class-teachers",
  subjectTeachersHref = "/admin/academic/teacher-assignments",
  showAdminHints = false,
}: {
  myClasses: MyClassRow[];
  subjectSlots: MySubjectSlotRow[];
  homeroomClasses: MyClassRow[];
  academicYearName?: string;
  classTeachersHref?: string;
  subjectTeachersHref?: string;
  showAdminHints?: boolean;
}) {
  const hasAnything = myClasses.length > 0 || subjectSlots.length > 0;

  return (
    <Card title={academicYearName ? `Your assignments · ${academicYearName}` : "Your assignments"}>
      {!hasAnything ? (
        <p className="text-sm text-muted-foreground">
          No class or subject assignments are linked to your account yet.
          {showAdminHints ? (
            <>
              {" "}
              An administrator can assign you under{" "}
              <Link href={classTeachersHref} className="font-medium text-brand hover:underline">
                Class teachers
              </Link>{" "}
              or{" "}
              <Link href={subjectTeachersHref} className="font-medium text-brand hover:underline">
                Subject teachers
              </Link>
              .
            </>
          ) : (
            " Contact your administrator if this looks wrong."
          )}
        </p>
      ) : (
        <div className="space-y-4">
          {homeroomClasses.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Homeroom
              </p>
              <ul className="space-y-1 text-sm">
                {homeroomClasses.map((c) => (
                  <li key={c.classId} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {classDisplayName({ name: c.className, stream: c.classStream })}
                    </span>
                    <Badge tone="success">Class head</Badge>
                    <span className="text-muted-foreground">
                      {c.level === "A_LEVEL" ? "A-Level" : "O-Level"} · {c.studentCount} learners
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {myClasses.filter((c) => !c.isHomeroom).length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Other class links
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {myClasses
                  .filter((c) => !c.isHomeroom)
                  .map((c) => (
                    <li key={c.classId}>
                      {classDisplayName({ name: c.className, stream: c.classStream })} ·{" "}
                      {c.level === "A_LEVEL" ? "A-Level" : "O-Level"} ·{" "}
                      {c.studentCount} learners
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}

          {subjectSlots.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject teaching slots ({subjectSlots.length})
              </p>
              <div className="max-h-48 overflow-auto rounded-md border border-border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Class</th>
                      <th className="px-3 py-2 font-medium">Subject</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subjectSlots.map((s) => (
                      <tr key={`${s.classId}-${s.subjectId}`}>
                        <td className="px-3 py-2 text-foreground">
                          {classDisplayName({ name: s.className, stream: s.classStream })}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {s.subjectCode} — {s.subjectName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
