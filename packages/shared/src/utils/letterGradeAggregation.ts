import { CBC_RATINGS, getCbcRatingScore, type CbcRating } from "../constants/cbcRatingBands";

export type TermLetterGradeAggregation = {
  grade: CbcRating;
  method: "most_frequent";
};

/**
 * Term aggregation for formative A–E ratings: most-frequent letter.
 * Tie-break: higher UNEB rank (A=5 … E=1) — fixed in CBC_RATING_BANDS, not admin-configurable.
 */
export function aggregateTermLetterGrade(grades: CbcRating[]): TermLetterGradeAggregation {
  if (grades.length === 0) {
    throw new Error("Cannot aggregate an empty grade set");
  }

  const counts = new Map<CbcRating, number>();
  for (const g of grades) {
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }

  let maxCount = 0;
  let tied: CbcRating[] = [];

  for (const [grade, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      tied = [grade];
    } else if (count === maxCount) {
      tied.push(grade);
    }
  }

  tied.sort((a, b) => getCbcRatingScore(b) - getCbcRatingScore(a));

  return { grade: tied[0]!, method: "most_frequent" };
}

export function parseCbcRating(value: string): CbcRating | null {
  const key = value.trim().toUpperCase();
  return CBC_RATINGS.includes(key as CbcRating) ? (key as CbcRating) : null;
}
