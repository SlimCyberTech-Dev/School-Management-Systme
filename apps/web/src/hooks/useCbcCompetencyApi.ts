"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import {
  cbcActivityCreateSchema,
  cbcCompetencyRatingsBulkSchema,
  cbcLearningOutcomeCreateSchema,
  cbcLearningOutcomeRecordCreateSchema,
  cbcTermSummaryOverrideSchema,
} from "@uganda-cbc-sms/shared";
import type { AssessmentActivity, TermCompetencySummaryRow } from "@/lib/cbcCompetency";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

type ActivityIn = z.infer<typeof cbcActivityCreateSchema>;
type RatingsBulkIn = z.infer<typeof cbcCompetencyRatingsBulkSchema>;
type LearningOutcomeIn = z.infer<typeof cbcLearningOutcomeCreateSchema>;
type LearningOutcomeRecordIn = z.infer<typeof cbcLearningOutcomeRecordCreateSchema>;
type OverrideIn = z.infer<typeof cbcTermSummaryOverrideSchema>;

export function useCbcTermSummary(filters: {
  studentId?: string;
  subjectId?: string;
  termId?: string;
}) {
  const qp = new URLSearchParams();
  if (filters.studentId) qp.set("studentId", filters.studentId);
  if (filters.subjectId) qp.set("subjectId", filters.subjectId);
  if (filters.termId) qp.set("termId", filters.termId);

  return useQuery({
    queryKey: ["cbc-term-summary", filters],
    queryFn: () => apiGet<TermCompetencySummaryRow[]>(`/assessments/cbc/term-summary?${qp.toString()}`),
    enabled: Boolean(filters.studentId && filters.subjectId && filters.termId),
  });
}

export function useCbcCompetencyMutations() {
  const qc = useQueryClient();

  const invalidateSummaries = () =>
    qc.invalidateQueries({ queryKey: ["cbc-term-summary"] });

  const createActivity = useMutation({
    mutationFn: (payload: ActivityIn) =>
      apiPost<AssessmentActivity>("/assessments/cbc/activities", payload),
  });

  const saveRatings = useMutation({
    mutationFn: (payload: RatingsBulkIn) =>
      apiPost<{ saved: number; activityId: string }>("/assessments/cbc/ratings", payload),
    onSuccess: () => void invalidateSummaries(),
  });

  const lockActivity = useMutation({
    mutationFn: (activityId: string) =>
      apiPatch<AssessmentActivity>(`/assessments/cbc/activities/${activityId}/lock`, {}),
  });

  const overrideSummary = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OverrideIn }) =>
      apiPatch<TermCompetencySummaryRow>(`/assessments/cbc/term-summary/${id}/override`, payload),
    onSuccess: () => void invalidateSummaries(),
  });

  const createLearningOutcome = useMutation({
    mutationFn: (payload: LearningOutcomeIn) =>
      apiPost<Record<string, unknown>>("/assessments/cbc/learning-outcomes", payload),
  });

  const createLearningOutcomeRecord = useMutation({
    mutationFn: (payload: LearningOutcomeRecordIn) =>
      apiPost<Record<string, unknown>>("/assessments/cbc/learning-outcome-records", payload),
  });

  return {
    createActivity,
    saveRatings,
    lockActivity,
    overrideSummary,
    createLearningOutcome,
    createLearningOutcomeRecord,
  };
}
