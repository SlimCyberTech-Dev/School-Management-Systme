import {
  CBC_RATINGS,
  type CbcRating,
  getCbcRatingDescriptor,
} from "../constants/cbcRatingBands";

export type LetterGradeDescriptorBand = {
  grade: string;
  descriptor?: string | null;
  isActive?: boolean;
};

/** Build A–E descriptor map from tenant grading scale rows (active A–E only). */
export function buildLetterGradeDescriptorMap(
  bands: LetterGradeDescriptorBand[],
): Record<CbcRating, string> {
  const map = Object.fromEntries(
    CBC_RATINGS.map((r) => [r, getCbcRatingDescriptor(r)]),
  ) as Record<CbcRating, string>;

  for (const band of bands) {
    if (band.isActive === false) continue;
    const grade = band.grade.trim().toUpperCase();
    if (!CBC_RATINGS.includes(grade as CbcRating)) continue;
    const text = band.descriptor?.trim();
    if (text) map[grade as CbcRating] = text;
  }

  return map;
}

/**
 * Resolve display descriptor for a UNEB letter grade.
 * Uses tenant-configured map when provided; falls back to CBC_RATING_BANDS constants.
 */
export function resolveLetterGradeDescriptor(
  grade: string,
  descriptorMap?: Partial<Record<CbcRating, string>>,
): string {
  const key = grade.trim().toUpperCase() as CbcRating;
  const custom = descriptorMap?.[key]?.trim();
  if (custom) return custom;
  return getCbcRatingDescriptor(grade);
}

/** Format for UI: "A — Exceptional" */
export function formatLetterGradeLabel(
  grade: CbcRating,
  descriptorMap?: Partial<Record<CbcRating, string>>,
): string {
  const descriptor = resolveLetterGradeDescriptor(grade, descriptorMap);
  return descriptor ? `${grade} — ${descriptor}` : grade;
}
