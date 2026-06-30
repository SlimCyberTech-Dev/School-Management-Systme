import type { CbcRating } from "../constants/cbcRatingBands";
import { CBC_RATINGS } from "../constants/cbcRatingBands";
import {
  resolveGradeFromScaleRows,
  type DefaultGradingScaleRow,
} from "../constants/assessmentGradingScales";
import type { AssessmentConfig, ExamsIncludedPolicy } from "./olevelCbcGrading";

export const TERM_FORMULA_VERSION = "term_exam_avg_v1";

export type TermExamBreakdownRow = {
  examId: string;
  examName: string;
  scorePct: number;
  isCompulsory: boolean;
  teacherInitial?: string | null;
};

export type TermExamMarksInput = {
  examId: string;
  examName: string;
  score: number;
  maxScore: number;
  isCompulsory: boolean;
  teacherInitial?: string | null;
};

export type TermSubjectGradeInput = {
  examMarks: TermExamMarksInput[];
  projectScores: Array<{ score: number; maxScore: number }>;
  config: AssessmentConfig;
  examsIncluded?: ExamsIncludedPolicy;
};

export type TermSubjectGradeResult = {
  examAverage: number | null;
  projectAverage: number | null;
  compositeScore: number | null;
  finalGrade: CbcRating | null;
  examBreakdown: TermExamBreakdownRow[];
  projectsCompleted: number;
  projectsExpected: number;
  includeProjectWork: boolean;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizePct(score: number, maxScore: number): number | null {
  const max = maxScore > 0 ? maxScore : 100;
  const pct = (score / max) * 100;
  if (Number.isNaN(pct)) return null;
  return round2(pct);
}

/** Mean of normalized percentage marks from selected exams. */
export function computeTermExamAverage(
  marks: TermExamMarksInput[],
  examsIncluded: ExamsIncludedPolicy = "compulsory_only",
): { average: number | null; breakdown: TermExamBreakdownRow[] } {
  const filtered =
    examsIncluded === "compulsory_only" ? marks.filter((m) => m.isCompulsory) : marks;

  const breakdown: TermExamBreakdownRow[] = [];
  const pcts: number[] = [];

  for (const m of filtered) {
    const scorePct = normalizePct(m.score, m.maxScore);
    if (scorePct == null) continue;
    pcts.push(scorePct);
    breakdown.push({
      examId: m.examId,
      examName: m.examName,
      scorePct,
      isCompulsory: m.isCompulsory,
      teacherInitial: m.teacherInitial ?? null,
    });
  }

  if (pcts.length === 0) return { average: null, breakdown };
  const avg = pcts.reduce((s, v) => s + v, 0) / pcts.length;
  return { average: round2(avg), breakdown };
}

/** Mean of project work scores for a single term (normalized to %). */
export function computeTermProjectAverage(
  scores: Array<{ score: number; maxScore: number }>,
): number | null {
  const pcts: number[] = [];
  for (const row of scores) {
    const pct = normalizePct(row.score, row.maxScore);
    if (pct != null) pcts.push(pct);
  }
  if (pcts.length === 0) return null;
  return round2(pcts.reduce((s, v) => s + v, 0) / pcts.length);
}

/**
 * Blend exam average with optional project average.
 * When includeProjectWorkInTermGrade is false, composite = exam average only.
 */
export function computeTermCompositeScore(
  examAverage: number | null,
  projectAverage: number | null,
  config: AssessmentConfig,
): number | null {
  if (examAverage == null && projectAverage == null) return null;

  if (!config.includeProjectWorkInTermGrade) {
    return examAverage;
  }

  if (examAverage != null && projectAverage != null) {
    const composite = config.caWeight * projectAverage + config.eocWeight * examAverage;
    return round2(composite);
  }

  return examAverage ?? projectAverage;
}

export function resolveTermFinalGrade(
  compositeScore: number | null,
  bands: Array<
    Pick<DefaultGradingScaleRow, "grade" | "minScore" | "maxScore" | "sortOrder"> & {
      isActive?: boolean;
    }
  >,
): CbcRating | null {
  if (compositeScore == null) return null;
  const resolved = resolveGradeFromScaleRows(compositeScore, bands);
  const grade = resolved?.grade?.toUpperCase() as CbcRating | undefined;
  if (!grade || !CBC_RATINGS.includes(grade)) return null;
  return grade;
}

export function computeTermSubjectGrade(
  input: TermSubjectGradeInput,
  bands: Array<
    Pick<DefaultGradingScaleRow, "grade" | "minScore" | "maxScore" | "sortOrder"> & {
      isActive?: boolean;
    }
  >,
): TermSubjectGradeResult {
  const examsIncluded = input.examsIncluded ?? input.config.examsIncluded ?? "compulsory_only";
  const { average: examAverage, breakdown } = computeTermExamAverage(
    input.examMarks,
    examsIncluded,
  );
  const projectAverage = computeTermProjectAverage(input.projectScores);
  const projectsCompleted = input.projectScores.length;
  const projectsExpected = Math.max(1, input.config.projectWork.expectedPerTerm);
  const compositeScore = computeTermCompositeScore(examAverage, projectAverage, input.config);
  const finalGrade = resolveTermFinalGrade(compositeScore, bands);

  return {
    examAverage,
    projectAverage,
    compositeScore,
    finalGrade,
    examBreakdown: breakdown,
    projectsCompleted,
    projectsExpected,
    includeProjectWork: input.config.includeProjectWorkInTermGrade,
  };
}
