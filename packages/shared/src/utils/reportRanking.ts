/**
 * Class ranking for report cards — aligned with Uganda school practice:
 * - A-Level / O-Level numeric exams: UNEB-style grade points (lower = better), aggregate from best subjects.
 * - CBC competency: mean of A–D ratings (higher = better).
 * - Exam percentage: mean of (score ÷ max) × 100 when points are not used for ranking.
 */

export type RankingMethod =
  | "alevel_best3_points"
  | "olevel_best8_points"
  | "exam_average_percent"
  | "cbc_competency_average";

export type ReportRankingSnapshot = {
  classSize: number;
  /** Competition rank (1 = best). Ties share the same position. */
  position: number;
  /** e.g. "1", "2=", "5 / 42" */
  positionLabel: string;
  /** Full display: "3 / 45" */
  positionDisplay: string;
  tied: boolean;
  aggregateValue: number;
  aggregateLabel: string;
  method: RankingMethod;
  subjectsCounted: number;
};

export const CBC_RATING_SCORE: Record<string, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

/** Mean competency score from CBC ratings (A=4 … D=1). Higher is better. */
export function cbcCompetencyAverage(ratings: string[]): number | null {
  const scores = ratings
    .map((r) => CBC_RATING_SCORE[String(r).trim().toUpperCase()] ?? 0)
    .filter((s) => s > 0);
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * O-Level / UCE-style aggregate: sum of points from the best N subjects (lowest point values = best grades).
 */
export function computeBestNPointsAggregate(
  pointValues: number[],
  bestN = 8,
): { aggregate: number; subjectsUsed: number } {
  const pts = pointValues.filter((p) => typeof p === "number" && !Number.isNaN(p)).sort((a, b) => a - b);
  const best = pts.slice(0, bestN);
  return {
    aggregate: best.reduce((sum, p) => sum + p, 0),
    subjectsUsed: best.length,
  };
}

/** Mean percentage across exam papers. Higher is better. */
export function computeExamAveragePercent(
  scores: Array<{ score: number; maxScore: number }>,
): number | null {
  const parts = scores.filter((s) => s.maxScore > 0 && !Number.isNaN(s.score));
  if (parts.length === 0) return null;
  const sum = parts.reduce((acc, s) => acc + (s.score / s.maxScore) * 100, 0);
  return Math.round((sum / parts.length) * 10) / 10;
}

export type RankableStudent = {
  studentId: string;
  sortKey: number;
  aggregateValue: number;
  aggregateLabel: string;
  method: RankingMethod;
  subjectsCounted: number;
};

/**
 * Standard competition ranking (1, 2, 2, 4). Ties share position; next rank skips.
 * @param lowerIsBetter — true for point aggregates (UNEB), false for averages
 */
export function assignCompetitionRanks(
  entries: RankableStudent[],
  lowerIsBetter: boolean,
): Map<string, ReportRankingSnapshot> {
  const classSize = entries.length;
  const result = new Map<string, ReportRankingSnapshot>();
  if (classSize === 0) return result;

  const sorted = [...entries].sort((a, b) =>
    lowerIsBetter ? a.sortKey - b.sortKey : b.sortKey - a.sortKey,
  );

  let i = 0;
  let rank = 0;
  while (i < sorted.length) {
    rank += 1;
    const sortKey = sorted[i]!.sortKey;
    let j = i + 1;
    while (j < sorted.length && sorted[j]!.sortKey === sortKey) j += 1;
    const tied = j - i > 1;
    const positionLabel = tied ? `${rank}=` : String(rank);
    const positionDisplay = `${positionLabel} / ${classSize}`;

    for (let k = i; k < j; k++) {
      const e = sorted[k]!;
      result.set(e.studentId, {
        classSize,
        position: rank,
        positionLabel,
        positionDisplay,
        tied,
        aggregateValue: e.aggregateValue,
        aggregateLabel: e.aggregateLabel,
        method: e.method,
        subjectsCounted: e.subjectsCounted,
      });
    }
    i = j;
  }

  return result;
}
