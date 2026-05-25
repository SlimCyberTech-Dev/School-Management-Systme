"use client";

import { useEffect, useState } from "react";
import { ExamScoreGrid } from "@/components/exams/ExamScoreGrid";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import { useGradingScales } from "@/hooks/useGradingScales";
import {
  useExam,
  useExamMarkActions,
  useExamMarks,
  useExamSubjects,
  type ExamTeacherSubject,
} from "@/hooks/useExams";
import { getApiErrorMessage } from "@/lib/api";
import { combineQueryStatus, queryStatus } from "@/lib/queryStatus";

export function TeacherExamMarksPanel({ examId }: { examId: string }) {
  const examQ = useExam(examId);
  const subjectsQ = useExamSubjects(examId);
  const [subjectId, setSubjectId] = useState("");
  const marksQ = useExamMarks(examId, subjectId || undefined);
  const actions = useExamMarkActions(examId);
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string }>({});

  const level =
    examQ.data?.classLevel === "A_LEVEL" ? ("A_LEVEL" as const) : ("O_LEVEL" as const);
  const gradingQ = useGradingScales(level);

  const subjects = subjectsQ.data ?? [];
  const editable = subjects.filter((s) => s.canEdit);

  useEffect(() => {
    if (!subjectId && editable[0]) setSubjectId(editable[0].subjectId);
    else if (!subjectId && subjects[0]) setSubjectId(subjects[0].subjectId);
  }, [editable, subjects, subjectId]);

  const marksStatus = queryStatus(marksQ);
  const metaStatus = combineQueryStatus([examQ, subjectsQ]);

  const activeSubject: ExamTeacherSubject | undefined = subjects.find((s) => s.subjectId === subjectId);

  const save = async (items: Array<{ studentId: string; score: number }>) => {
    if (!subjectId) return;
    if (items.length === 0) {
      setFeedback({ err: "Enter at least one score before saving." });
      return;
    }
    setFeedback({});
    try {
      const res = await actions.saveBulk.mutateAsync({ subjectId, marks: items });
      setFeedback({ ok: `Saved ${res.saved} mark${res.saved === 1 ? "" : "s"}.` });
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  const submit = async () => {
    if (!subjectId) return;
    setFeedback({});
    try {
      await actions.submit.mutateAsync(subjectId);
      setFeedback({ ok: "Marks submitted and locked. Contact the headteacher if you need changes." });
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  return (
    <div className="space-y-4">
      <AsyncContent
        status={metaStatus}
        loading={<FormSkeleton fields={3} />}
        error={
          <ErrorState
            message={
              examQ.error instanceof Error
                ? examQ.error.message
                : "We couldn't load exam details."
            }
            onRetry={() => {
              void examQ.refetch();
              void subjectsQ.refetch();
            }}
          />
        }
      >
        {subjects.length === 0 ? (
          <Alert tone="info">
            You have no subjects on this exam, or marking is not available for your assignments.
          </Alert>
        ) : (
          <Select
            label="Subject"
            options={subjects.map((s) => ({
              value: s.subjectId,
              label: `${s.subjectCode} — ${s.subjectName}${s.isSubmitted ? " (submitted)" : ""}`,
            }))}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          />
        )}
      </AsyncContent>

      {feedback.ok ? <Alert tone="success">{feedback.ok}</Alert> : null}
      {feedback.err ? <Alert tone="error">{feedback.err}</Alert> : null}

      {subjectId ? (
        <AsyncContent
          status={marksStatus}
          loading={<FormSkeleton fields={6} />}
          error={
            <ErrorState
              message={marksQ.error instanceof Error ? marksQ.error.message : "We couldn't load marks."}
              onRetry={() => void marksQ.refetch()}
            />
          }
        >
          {marksQ.data ? (
            <ExamScoreGrid
              students={marksQ.data.students}
              maxScore={marksQ.data.maxScore}
              gradingScaleRows={gradingQ.data}
              readOnly={
                marksQ.data.subjectSubmitted ||
                !activeSubject?.canEdit ||
                marksQ.data.exam.status !== "open"
              }
              onSave={save}
              onSubmit={submit}
              saving={actions.saveBulk.isPending}
              submitting={actions.submit.isPending}
            />
          ) : null}
        </AsyncContent>
      ) : null}
    </div>
  );
}
