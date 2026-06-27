/** Official O-Level CBC competency rating bands (UNEB/NCDC — no fail grade). */
export const CBC_RATINGS = ["A", "B", "C", "D", "E"] as const;

export type CbcRating = (typeof CBC_RATINGS)[number];

/** NCDC 4-level competency descriptor scale (canonical for new CBC entry). */
export const COMPETENCY_LEVELS = [
  "exceeds_expectations",
  "meets_expectations",
  "approaching_expectations",
  "below_expectations",
] as const;

export type CompetencyLevel = (typeof COMPETENCY_LEVELS)[number];

export const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  exceeds_expectations: "Exceeds Expectations",
  meets_expectations: "Meets Expectations",
  approaching_expectations: "Approaching Expectations",
  below_expectations: "Below Expectations",
};

/** Internal rank for sort/aggregation only — never expose in API responses or UI. */
export const COMPETENCY_LEVEL_RANK: Record<CompetencyLevel, number> = {
  exceeds_expectations: 4,
  meets_expectations: 3,
  approaching_expectations: 2,
  below_expectations: 1,
};

export const CBC_RATING_BANDS: Record<
  CbcRating,
  { descriptor: string; score: number }
> = {
  A: { descriptor: "Exceptional", score: 5 },
  B: { descriptor: "Outstanding", score: 4 },
  C: { descriptor: "Satisfactory", score: 3 },
  D: { descriptor: "Basic", score: 2 },
  E: { descriptor: "Elementary", score: 1 },
};

/** Letter → NCDC descriptor (E collapses to below, matching migration 072). */
export function legacyRatingToCompetencyLevel(rating: string): CompetencyLevel {
  switch (rating.trim().toUpperCase()) {
    case "A":
      return "exceeds_expectations";
    case "B":
      return "meets_expectations";
    case "C":
      return "approaching_expectations";
    case "D":
    case "E":
      return "below_expectations";
    default:
      return "below_expectations";
  }
}

/**
 * Compatibility shim: map NCDC descriptor → nearest legacy letter for dual-write consumers
 * (reportCompiler, olevelCaLoader) still reading `rating` during transition.
 * Lossy: both approaching→C and below→D; legacy E is not produced from descriptors.
 */
export function competencyLevelToLegacyRating(level: CompetencyLevel): CbcRating {
  switch (level) {
    case "exceeds_expectations":
      return "A";
    case "meets_expectations":
      return "B";
    case "approaching_expectations":
      return "C";
    case "below_expectations":
      return "D";
  }
}

export function getCbcRatingDescriptor(rating: string): string {
  const key = rating.trim().toUpperCase() as CbcRating;
  return CBC_RATING_BANDS[key]?.descriptor ?? "";
}

export function getCbcRatingScore(rating: string): number {
  const key = rating.trim().toUpperCase() as CbcRating;
  return CBC_RATING_BANDS[key]?.score ?? 0;
}

export function getCompetencyLevelLabel(level: CompetencyLevel): string {
  return COMPETENCY_LEVEL_LABELS[level];
}

/** @deprecated Use CBC_RATING_BANDS */
export const CBC_RATING_DESCRIPTORS: Record<string, string> = Object.fromEntries(
  CBC_RATINGS.map((r) => [r, CBC_RATING_BANDS[r].descriptor]),
);
