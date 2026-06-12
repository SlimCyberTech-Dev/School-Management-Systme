import {
  DEFAULT_ASSESSMENT_GRADING_SCALES,
  resolveGradeFromScaleRows,
  validateGradingScaleRows,
  type GradingScaleLevel,
} from "@uganda-cbc-sms/shared";
import { query } from "../config/db";
export type GradingScaleBand = {
  grade: string;
  minScore: number;
  maxScore: number;
  points: number;
  sortOrder: number;
  isActive: boolean;
};

export { validateGradingScaleRows };

export function resolveGradeFromBands(
  score: number,
  bands: GradingScaleBand[],
): { grade: string; points: number } | null {
  return resolveGradeFromScaleRows(score, bands);
}

export async function loadActiveGradingBands(level: GradingScaleLevel): Promise<GradingScaleBand[]> {
  const { rows } = await query<{
    grade: string;
    min_score: string;
    max_score: string;
    points: number;
    sort_order: number;
    is_active: boolean;
  }>(
    `SELECT grade, min_score, max_score, points, sort_order, is_active
     FROM assessment_grading_scales
     WHERE level = $1
     ORDER BY sort_order ASC, min_score DESC`,
    [level],
  );

  return rows.map((r) => ({
    grade: r.grade,
    minScore: Number(r.min_score),
    maxScore: Number(r.max_score),
    points: Number(r.points),
    sortOrder: Number(r.sort_order),
    isActive: Boolean(r.is_active),
  }));
}

export async function resolveConfiguredGrade(
  score: number,
  level: GradingScaleLevel,
): Promise<{ grade: string; points: number }> {
  const bands = await loadActiveGradingBands(level);
  const fromConfig = resolveGradeFromBands(score, bands);
  if (fromConfig) return fromConfig;
  const fromDefaults = resolveGradeFromBands(
    score,
    defaultScaleRows(level).map((r) => ({
      ...r,
      sortOrder: r.sortOrder,
    })),
  );
  if (fromDefaults) return fromDefaults;
  const lastResort = resolveGradeFromBands(
    score,
    DEFAULT_ASSESSMENT_GRADING_SCALES[level].map((r) => ({
      grade: r.grade,
      minScore: r.minScore,
      maxScore: r.maxScore,
      points: r.points,
      sortOrder: r.sortOrder,
      isActive: true,
    })),
  );
  if (lastResort) return lastResort;
  return { grade: "F", points: 9 };
}

export function defaultScaleRows(level: GradingScaleLevel) {
  return DEFAULT_ASSESSMENT_GRADING_SCALES[level].map((row) => ({
    ...row,
    isActive: true,
  }));
}
