import {
  DEFAULT_ASSESSMENT_GRADING_SCALES,
  buildLetterGradeDescriptorMap,
  resolveGradeFromScaleRows,
  resolveLetterGradeDescriptor,
  validateGradingScaleRows,
  CBC_RATINGS,
  type CbcRating,
  type GradingScaleLevel,
} from "@uganda-cbc-sms/shared";
import { query } from "../config/db";
import { getGradingScheme } from "./assessmentConfig";

export type GradingScaleBand = {
  grade: string;
  minScore: number;
  maxScore: number;
  points: number | null;
  descriptor: string | null;
  sortOrder: number;
  isActive: boolean;
};

export { validateGradingScaleRows };

export function resolveGradeFromBands(
  score: number,
  bands: GradingScaleBand[],
): { grade: string; points: number | null } | null {
  return resolveGradeFromScaleRows(score, bands);
}

export async function loadActiveGradingBands(level: GradingScaleLevel): Promise<GradingScaleBand[]> {
  const { rows } = await query<{
    grade: string;
    min_score: string;
    max_score: string;
    points: number | null;
    descriptor: string | null;
    sort_order: number;
    is_active: boolean;
  }>(
    `SELECT grade, min_score, max_score, points, descriptor, sort_order, is_active
     FROM assessment_grading_scales
     WHERE level = $1
     ORDER BY sort_order ASC, min_score DESC`,
    [level],
  );

  return rows.map((r) => ({
    grade: r.grade,
    minScore: Number(r.min_score),
    maxScore: Number(r.max_score),
    points: r.points != null ? Number(r.points) : null,
    descriptor: r.descriptor,
    sortOrder: Number(r.sort_order),
    isActive: Boolean(r.is_active),
  }));
}

/** Tenant-configured UNEB achievement descriptors (O_LEVEL active A–E bands). */
export async function loadActiveLetterGradeDescriptorMap(): Promise<Record<CbcRating, string>> {
  const bands = await loadActiveGradingBands("O_LEVEL");
  return buildLetterGradeDescriptorMap(bands);
}

export async function getActiveLetterGradeDescriptor(grade: string): Promise<string> {
  const map = await loadActiveLetterGradeDescriptorMap();
  return resolveLetterGradeDescriptor(grade, map);
}

export async function resolveConfiguredGrade(
  score: number,
  level: GradingScaleLevel,
): Promise<{ grade: string; points: number | null }> {
  const resolver = await createGradingResolver(level);
  return resolver(score);
}

export type GradingResolver = (score: number) => { grade: string; points: number | null };

function resolveGradeFromLoadedContext(
  score: number,
  level: GradingScaleLevel,
  scheme: string,
  bands: GradingScaleBand[],
): { grade: string; points: number | null } {
  const fromConfig = resolveGradeFromBands(score, bands);
  if (fromConfig) {
    if (level === "O_LEVEL" && scheme === "cbc_2024_v1") {
      return { grade: fromConfig.grade, points: fromConfig.points ?? null };
    }
    return fromConfig;
  }
  const fromDefaults = resolveGradeFromBands(
    score,
    defaultScaleRows(level).map((r) => ({
      ...r,
      sortOrder: r.sortOrder,
      points: r.points ?? null,
    })),
  );
  if (fromDefaults) {
    if (level === "O_LEVEL") return { grade: fromDefaults.grade, points: null };
    return fromDefaults;
  }
  const lastResort = resolveGradeFromBands(
    score,
    DEFAULT_ASSESSMENT_GRADING_SCALES[level].map((r) => ({
      grade: r.grade,
      minScore: r.minScore,
      maxScore: r.maxScore,
      points: r.points ?? null,
      descriptor: r.descriptor ?? null,
      sortOrder: r.sortOrder,
      isActive: true,
    })),
  );
  if (lastResort) {
    if (level === "O_LEVEL") return { grade: lastResort.grade, points: null };
    return lastResort;
  }
  if (level === "O_LEVEL") return { grade: "E", points: null };
  return { grade: "F", points: 9 };
}

/** Load tenant grading bands once, then resolve many scores without extra DB round-trips. */
export async function createGradingResolver(level: GradingScaleLevel): Promise<GradingResolver> {
  const scheme = await getGradingScheme(level);
  const bands = await loadActiveGradingBands(level);
  return (score: number) => resolveGradeFromLoadedContext(score, level, scheme, bands);
}

export function defaultScaleRows(level: GradingScaleLevel) {
  return DEFAULT_ASSESSMENT_GRADING_SCALES[level].map((row) => ({
    ...row,
    isActive: true,
  }));
}
