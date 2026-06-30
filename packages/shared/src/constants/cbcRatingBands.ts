/** Official O-Level A–E letter grade bands (UNEB/NCDC — no fail grade). */
export const CBC_RATINGS = ["A", "B", "C", "D", "E"] as const;

export type CbcRating = (typeof CBC_RATINGS)[number];

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

/**
 * Static UNEB default descriptor (CBC_RATING_BANDS).
 * For tenant-configured wording use resolveLetterGradeDescriptor() with grading scale rows.
 */
export function getCbcRatingDescriptor(
  rating: string,
  descriptorMap?: Partial<Record<CbcRating, string>>,
): string {
  const key = rating.trim().toUpperCase() as CbcRating;
  const custom = descriptorMap?.[key]?.trim();
  if (custom) return custom;
  return CBC_RATING_BANDS[key]?.descriptor ?? "";
}

export function getCbcRatingScore(rating: string): number {
  const key = rating.trim().toUpperCase() as CbcRating;
  return CBC_RATING_BANDS[key]?.score ?? 0;
}

/** @deprecated Use CBC_RATING_BANDS */
export const CBC_RATING_DESCRIPTORS: Record<string, string> = Object.fromEntries(
  CBC_RATINGS.map((r) => [r, CBC_RATING_BANDS[r].descriptor]),
);
