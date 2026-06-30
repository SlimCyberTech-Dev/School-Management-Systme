"use client";

import { useState } from "react";
import type { CbcRating } from "@uganda-cbc-sms/shared";
import { CompetencyLevelSelector } from "@/components/cbc/CompetencyLevelSelector";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api";
import { useCbcCompetencyMutations } from "@/hooks/useCbcCompetencyApi";

type Student = { id: string; fullName: string; studentNumber: string };

type OutcomeRow = {
  id: string;
  description: string;
  strandId: string;
  createdAt: string;
};

export function CbcLearningOutcomesPanel({
  subjectId,
  termId,
  strandOptions,
  students,
}: {
  subjectId: string;
  termId: string;
  strandOptions: { value: string; label: string }[];
  students: Student[];
}) {
  const { createLearningOutcome, createLearningOutcomeRecord } = useCbcCompetencyMutations();
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([]);
  const [strandId, setStrandId] = useState(strandOptions[0]?.value ?? "");
  const [description, setDescription] = useState("");
  const [selectedOutcomeId, setSelectedOutcomeId] = useState("");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [achievementGrade, setAchievementGrade] = useState<CbcRating | "">("");
  const [remark, setRemark] = useState("");
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string }>({});

  const addOutcome = async () => {
    setFeedback({});
    if (!strandId || !description.trim()) {
      setFeedback({ err: "Choose a strand and enter a learning outcome description." });
      return;
    }
    try {
      const row = await createLearningOutcome.mutateAsync({
        subjectId,
        strandId,
        termId,
        description: description.trim(),
      });
      const created: OutcomeRow = {
        id: String(row.id),
        description: description.trim(),
        strandId,
        createdAt: new Date().toISOString(),
      };
      setOutcomes((prev) => [created, ...prev]);
      setSelectedOutcomeId(created.id);
      setDescription("");
      setFeedback({ ok: "Learning outcome added." });
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  const addRecord = async () => {
    setFeedback({});
    if (!selectedOutcomeId || !studentId || !achievementGrade) {
      setFeedback({ err: "Select an outcome, student, and achievement grade." });
      return;
    }
    try {
      await createLearningOutcomeRecord.mutateAsync({
        studentId,
        learningOutcomeId: selectedOutcomeId,
        achievementGrade,
        remark: remark.trim() || undefined,
      });
      setAchievementGrade("");
      setRemark("");
      setFeedback({ ok: "Student achievement recorded." });
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  return (
    <div className="space-y-6">
      {feedback.ok ? <Alert tone="success">{feedback.ok}</Alert> : null}
      {feedback.err ? <Alert tone="error">{feedback.err}</Alert> : null}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add learning outcome</h3>
        <p className="text-xs text-muted-foreground">
          Outcomes are stored per subject, strand, and term. There is no list endpoint yet — outcomes you add in this
          session appear below.
        </p>
        <Select label="Strand" options={strandOptions} value={strandId} onChange={(e) => setStrandId(e.target.value)} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Description</span>
          <textarea
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <Button type="button" loading={createLearningOutcome.isPending} onClick={() => void addOutcome()}>
          Add outcome
        </Button>
      </div>

      {outcomes.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Record student achievement</h3>
          <Select
            label="Learning outcome"
            options={outcomes.map((o) => ({ value: o.id, label: o.description.slice(0, 80) }))}
            value={selectedOutcomeId}
            onChange={(e) => setSelectedOutcomeId(e.target.value)}
          />
          <Select
            label="Student"
            options={students.map((s) => ({ value: s.id, label: `${s.fullName} (${s.studentNumber})` }))}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
          <div>
            <p className="mb-1 text-sm font-medium">Achievement grade (A–E)</p>
            <CompetencyLevelSelector value={achievementGrade} onChange={setAchievementGrade} />
          </div>
          <Input label="Remark (optional)" value={remark} onChange={(e) => setRemark(e.target.value)} />
          <Button type="button" loading={createLearningOutcomeRecord.isPending} onClick={() => void addRecord()}>
            Save record
          </Button>
        </div>
      ) : (
        <Alert tone="info">Add a learning outcome above to record per-student achievement.</Alert>
      )}
    </div>
  );
}
