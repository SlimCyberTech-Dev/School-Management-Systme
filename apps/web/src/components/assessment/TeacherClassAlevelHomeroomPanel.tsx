"use client";

import { useEffect, useMemo, useState } from "react";
import { ALevelComments } from "@/components/assessment/ALevelComments";
import { ALevelDivisionSummary } from "@/components/assessment/ALevelDivisionSummary";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  useAlevelActions,
  useAlevelComments,
  useAlevelDivision,
} from "@/hooks/useALevelAssessment";
import { useMyTeachingScope, type MyClassRow } from "@/hooks/useMyTeachingScope";
import { manualStatus } from "@/lib/queryStatus";
import { classDisplayName } from "@/lib/academicLevel";

type CommentRow = {
  student_id: string;
  student_name: string;
  class_teacher_comment?: string | null;
  headteacher_remark?: string | null;
};

export function TeacherClassAlevelHomeroomPanel({
  yearId,
  termId,
}: {
  yearId: string;
  termId: string;
}) {
  const [classId, setClassId] = useState("");
  const scope = useMyTeachingScope();

  const homeroomClasses: MyClassRow[] = useMemo(() => {
    if (yearId && scope.yearId !== yearId) return [];
    return scope.homeroomClasses.filter((c) => c.level === "A_LEVEL");
  }, [scope.homeroomClasses, scope.yearId, yearId]);

  useEffect(() => {
    if (!homeroomClasses.length) {
      setClassId("");
      return;
    }
    if (!classId || !homeroomClasses.some((c) => c.classId === classId)) {
      setClassId(homeroomClasses[0]!.classId);
    }
  }, [homeroomClasses, classId]);

  const divisionQ = useAlevelDivision({
    classId: classId || undefined,
    termId: termId || undefined,
    yearId: yearId || undefined,
  });
  const commentsQ = useAlevelComments({
    classId: classId || undefined,
    termId: termId || undefined,
    yearId: yearId || undefined,
  });
  const alevelActions = useAlevelActions();

  const panelStatus = manualStatus({
    loading: scope.isLoading || (Boolean(classId) && (divisionQ.isLoading || commentsQ.isLoading)),
    error: scope.error ?? divisionQ.error ?? commentsQ.error,
    data: homeroomClasses,
    isEmpty: (d) => Array.isArray(d) && d.length === 0,
  });

  if (!yearId || !termId) return null;

  return (
    <Card title="Your A-Level class — overview">
      <p className="mb-4 text-sm text-muted-foreground">
        As class teacher, review division summaries and add learner comments. Subject teachers enter UNEB scores for
        each paper from their assignment list below.
      </p>

      <AsyncContent
        status={panelStatus}
        loading={<p className="text-sm text-muted-foreground">Loading your classes…</p>}
        error={
          <ErrorState
            message={
              scope.error instanceof Error ? scope.error.message : "Could not load your A-Level classes."
            }
            onRetry={() => void scope.refetch()}
          />
        }
        empty={
          <p className="text-sm text-muted-foreground">
            You are not set as class teacher on an A-Level class for this academic year.
          </p>
        }
      >
        {homeroomClasses.length > 0 ? (
          <div className="space-y-4">
            <Select
              label="A-Level class"
              options={homeroomClasses.map((c) => ({
                value: c.classId,
                label: classDisplayName({ name: c.className, stream: c.classStream }),
              }))}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Division summary</h3>
                <ALevelDivisionSummary
                  rows={(divisionQ.data as Array<Record<string, unknown>> | undefined) ?? []}
                />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Class teacher comments</h3>
                <ALevelComments
                  role="class_teacher"
                  rows={(
                    (commentsQ.data as CommentRow[] | undefined) ?? []
                  ).map((x) => ({
                    studentId: x.student_id,
                    studentName: x.student_name,
                    classTeacherComment: x.class_teacher_comment,
                    headteacherRemark: x.headteacher_remark,
                  }))}
                  onSave={(studentId, payload) =>
                    alevelActions.updateComment.mutateAsync({
                      studentId,
                      payload: { ...payload, termId, yearId },
                    })
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
      </AsyncContent>
    </Card>
  );
}
