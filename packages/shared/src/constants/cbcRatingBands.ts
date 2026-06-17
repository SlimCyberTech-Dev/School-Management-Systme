/** Official O-Level CBC competency rating bands (UNEB/NCDC — no fail grade). */
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

export function getCbcRatingDescriptor(rating: string): string {
  const key = rating.trim().toUpperCase() as CbcRating;
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
