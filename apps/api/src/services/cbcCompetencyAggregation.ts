import type { CompetencyLevel } from "@uganda-cbc-sms/shared";
import { COMPETENCY_LEVEL_RANK } from "@uganda-cbc-sms/shared";

export type TermCompetencyAggregation = {
  level: CompetencyLevel;
  method: "most_frequent";
};

/**
 * NCDC term aggregation: most-frequent competency_level across activity ratings.
 * Tie-break: prefer the higher-ranked level among tied counts.
 */
export function aggregateTermCompetencyLevel(ratings: CompetencyLevel[]): TermCompetencyAggregation {
  if (ratings.length === 0) {
    throw new Error("Cannot aggregate an empty rating set");
  }

  const counts = new Map<CompetencyLevel, number>();
  for (const rating of ratings) {
    counts.set(rating, (counts.get(rating) ?? 0) + 1);
  }

  let maxCount = 0;
  let tied: CompetencyLevel[] = [];

  for (const [level, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      tied = [level];
    } else if (count === maxCount) {
      tied.push(level);
    }
  }

  tied.sort((a, b) => COMPETENCY_LEVEL_RANK[b] - COMPETENCY_LEVEL_RANK[a]);

  return { level: tied[0]!, method: "most_frequent" };
}
