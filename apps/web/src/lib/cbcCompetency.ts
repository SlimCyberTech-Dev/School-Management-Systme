import type { CbcRating } from "@uganda-cbc-sms/shared";
import { assessmentActivityTypeSchema } from "@uganda-cbc-sms/shared/schemas/assessment.schema";

/** UNEB formative / report letter grade (A–E). Alias of shared CbcRating. */
export type LetterGrade = CbcRating;

export type AssessmentActivityType = ReturnType<typeof assessmentActivityTypeSchema.parse>;

export { assessmentActivityTypeSchema };

export const ACTIVITY_TYPE_LABELS: Record<AssessmentActivityType, string> = {
  assignment: "Assignment",
  project: "Project",
  group_work: "Group work",
  practical: "Practical",
  participation: "Participation",
  presentation: "Presentation",
  test: "Test",
};

export const ACTIVITY_TYPE_OPTIONS = (
  Object.entries(ACTIVITY_TYPE_LABELS) as [AssessmentActivityType, string][]
).map(([value, label]) => ({ value, label }));

export type AssessmentActivity = {
  id: string;
  subject_id: string;
  class_id: string;
  term_id: string;
  academic_year_id: string;
  teacher_id: string;
  activity_type: AssessmentActivityType;
  title: string;
  activity_date: string;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string;
};

export type TermCompetencySummaryRow = {
  id: string;
  student_id: string;
  subject_id: string;
  competency_id: string;
  term_id: string;
  aggregated_grade: LetterGrade;
  aggregation_method: string;
  is_teacher_override: boolean;
  overridden_grade: LetterGrade | null;
  override_justification: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  created_at: string;
  updated_at: string;
  competency_name?: string;
  effective_grade: LetterGrade;
};

export type NormalizedCompetency = {
  id: string;
  name: string;
  strandId: string;
};

const ACTIVITY_STORAGE_KEY = "cbc-assessment-activities-v1";

export function activityContextKey(
  classId: string,
  subjectId: string,
  termId: string,
  academicYearId: string,
) {
  return `${classId}:${subjectId}:${termId}:${academicYearId}`;
}

export function loadStoredActivities(contextKey: string): AssessmentActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as AssessmentActivity[];
    return all.filter((a) => activityContextKey(a.class_id, a.subject_id, a.term_id, a.academic_year_id) === contextKey);
  } catch {
    return [];
  }
}

export function storeActivity(activity: AssessmentActivity) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as AssessmentActivity[]) : [];
    const next = [activity, ...all.filter((a) => a.id !== activity.id)];
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}

export function patchStoredActivity(id: string, patch: Partial<AssessmentActivity>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as AssessmentActivity[];
    localStorage.setItem(
      ACTIVITY_STORAGE_KEY,
      JSON.stringify(all.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    );
  } catch {
    /* ignore */
  }
}

export function mapCbcRatingsError(status: number | undefined): string {
  if (status === 400) {
    return "This activity is locked — you cannot save further competency ratings for it. Activity lock is separate from legacy strand-sheet unlock (headteacher only on the old submission flow).";
  }
  if (status === 403) {
    return "You are not assigned to this class and subject, or you did not create this activity.";
  }
  return "We could not save competency ratings. Check your connection and try again.";
}

export function normalizeCompetencyName(name: string) {
  return name.trim().toLowerCase();
}
