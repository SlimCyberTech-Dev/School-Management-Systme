"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import type { CompetencyLevel } from "@/lib/cbcCompetency";
import { CompetencyLevelSelector } from "@/components/cbc/CompetencyLevelSelector";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { mapCbcRatingsError, patchStoredActivity, type AssessmentActivity, type NormalizedCompetency } from "@/lib/cbcCompetency";
import { getApiErrorMessage } from "@/lib/api";
import { useCbcCompetencyMutations } from "@/hooks/useCbcCompetencyApi";

type Student = { id: string; fullName: string; studentNumber: string };

export function CbcActivityRatingsGrid({
  activity,
  students,
  competencies,
  readOnly,
  onLocked,
}: {
  activity: AssessmentActivity;
  students: Student[];
  competencies: NormalizedCompetency[];
  readOnly?: boolean;
  onLocked?: () => void;
}) {
  const { saveRatings, lockActivity } = useCbcCompetencyMutations();
  const [levels, setLevels] = useState<Record<string, CompetencyLevel | "">>({});
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string }>({});
  const [confirmLock, setConfirmLock] = useState(false);

  const key = (studentId: string, competencyId: string) => `${studentId}::${competencyId}`;

  const columns = useMemo(() => competencies, [competencies]);

  useEffect(() => {
    setLevels({});
    setFeedback({});
  }, [activity.id]);

  const save = async () => {
    setFeedback({});
    const ratings = [];
    for (const student of students) {
      for (const comp of columns) {
        const level = levels[key(student.id, comp.id)];
        if (!level) continue;
        ratings.push({
          studentId: student.id,
          competencyId: comp.id,
          strandId: comp.strandId,
          competencyLevel: level,
        });
      }
    }
    if (ratings.length === 0) {
      setFeedback({ err: "Select at least one competency level before saving." });
      return;
    }
    try {
      await saveRatings.mutateAsync({
        assessmentActivityId: activity.id,
        ratings,
      });
      setFeedback({ ok: "Competency ratings saved." });
    } catch (e) {
      const status = isAxiosError(e) ? e.response?.status : undefined;
      setFeedback({ err: status ? mapCbcRatingsError(status) : getApiErrorMessage(e) });
    }
  };

  const lock = async () => {
    setFeedback({});
    try {
      const updated = await lockActivity.mutateAsync(activity.id);
      patchStoredActivity(activity.id, { is_locked: true, locked_at: updated.locked_at });
      setConfirmLock(false);
      setFeedback({ ok: "Activity locked. Ratings can no longer be edited." });
      onLocked?.();
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  if (columns.length === 0) {
    return (
      <Alert tone="info">
        Competency IDs are not available yet. Save at least one rating using an existing imported activity, or ask
        for a GET endpoint that lists <code className="text-xs">cbc_competencies</code> per strand.
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.ok ? <Alert tone="success">{feedback.ok}</Alert> : null}
      {feedback.err ? <Alert tone="error">{feedback.err}</Alert> : null}

      <div className="overflow-x-auto rounded border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="sticky left-0 z-10 bg-muted/40 px-2 py-2 text-left">Student</th>
              {columns.map((c) => (
                <th key={c.id} className="px-2 py-2 text-left whitespace-nowrap font-normal">
                  <span className="block max-w-[8rem] truncate text-xs font-medium" title={c.name}>
                    {c.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t border-border">
                <td className="sticky left-0 z-10 bg-card px-2 py-2">
                  <div className="font-medium">{student.fullName}</div>
                  <div className="text-xs text-muted-foreground">{student.studentNumber}</div>
                </td>
                {columns.map((comp) => {
                  const k = key(student.id, comp.id);
                  return (
                    <td key={k} className="px-2 py-2 align-top">
                      <CompetencyLevelSelector
                        value={levels[k] ?? ""}
                        disabled={readOnly || activity.is_locked}
                        onChange={(level) =>
                          setLevels((prev) => {
                            const next = { ...prev };
                            if (!level) delete next[k];
                            else next[k] = level;
                            return next;
                          })
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && !activity.is_locked ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" loading={saveRatings.isPending} onClick={() => void save()}>
            Save ratings
          </Button>
          <Button type="button" variant="secondary" onClick={() => setConfirmLock(true)}>
            Lock activity
          </Button>
        </div>
      ) : (
        <Alert tone="info">This activity is locked — ratings are view-only.</Alert>
      )}

      <ConfirmDialog
        open={confirmLock}
        title="Lock this activity?"
        description="After locking, competency ratings for this activity cannot be changed. This cannot be undone from your account."
        confirmLabel="Lock activity"
        danger
        loading={lockActivity.isPending}
        onCancel={() => setConfirmLock(false)}
        onConfirm={() => void lock()}
      />
    </div>
  );
}
