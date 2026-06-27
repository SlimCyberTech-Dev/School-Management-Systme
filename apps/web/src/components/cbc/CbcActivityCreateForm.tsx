"use client";

import { useState } from "react";
import { cbcActivityCreateSchema } from "@uganda-cbc-sms/shared";
import { ActivityTypeBadge } from "@/components/cbc/ActivityTypeBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ACTIVITY_TYPE_OPTIONS, storeActivity, type AssessmentActivity } from "@/lib/cbcCompetency";
import { getApiErrorMessage } from "@/lib/api";
import { useCbcCompetencyMutations } from "@/hooks/useCbcCompetencyApi";

export function CbcActivityCreateForm({
  subjectId,
  classId,
  termId,
  academicYearId,
  onCreated,
}: {
  subjectId: string;
  classId: string;
  termId: string;
  academicYearId: string;
  onCreated: (activity: AssessmentActivity) => void;
}) {
  const { createActivity } = useCbcCompetencyMutations();
  const [activityType, setActivityType] = useState<(typeof ACTIVITY_TYPE_OPTIONS)[number]["value"]>("assignment");
  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    const payload = cbcActivityCreateSchema.safeParse({
      subjectId,
      classId,
      termId,
      academicYearId,
      activityType,
      title: title.trim(),
      activityDate,
    });
    if (!payload.success) {
      setErr("Fill in activity type, title, and date.");
      return;
    }
    try {
      const row = await createActivity.mutateAsync(payload.data);
      storeActivity(row);
      onCreated(row);
      setTitle("");
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">New assessment activity</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create the graded event first, then enter competency ratings for each student.
        </p>
      </div>

      {err ? <Alert tone="error">{err}</Alert> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Select
          label="Activity type"
          options={ACTIVITY_TYPE_OPTIONS}
          value={activityType}
          onChange={(e) => setActivityType(e.target.value as typeof activityType)}
        />
        <Input label="Activity date" type="date" value={activityDate} onChange={(e) => setActivityDate(e.target.value)} />
        <div className="md:col-span-2">
          <Input
            label="Title"
            value={title}
            placeholder="e.g. Term 1 practical — soil sampling"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ActivityTypeBadge type={activityType} />
        <Button type="button" loading={createActivity.isPending} onClick={() => void submit()}>
          Create activity
        </Button>
      </div>
    </div>
  );
}
