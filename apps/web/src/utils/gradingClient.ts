import {
  DEFAULT_ASSESSMENT_GRADING_SCALES,
  resolveGradeFromScaleRows,
  type GradingScaleLevel,
} from "@uganda-cbc-sms/shared";

type ScaleRow = {
  grade: string;
  minScore: number;
  maxScore: number;
  points: number;
  sortOrder?: number;
  isActive?: boolean;
};

function hardcodedGrade(score: number, level: GradingScaleLevel): { grade: string; points: number } {
  const rows = DEFAULT_ASSESSMENT_GRADING_SCALES[level];
  const fromDefaults = resolveGradeFromScaleRows(score, rows);
  if (fromDefaults) return fromDefaults;
  if (score >= 80) return { grade: "A", points: 1 };
  if (score >= 75) return { grade: "B", points: 2 };
  if (score >= 65) return { grade: "C", points: 3 };
  if (score >= 60) return { grade: "D", points: 4 };
  if (score >= 55) return { grade: "E", points: 5 };
  if (score >= 45) return { grade: "O", points: 6 };
  return { grade: "F", points: 9 };
}

/** Resolve letter grade and points for a 0–100 score using the correct level scale. */
export function computeGradeForLevel(
  score: number,
  level: GradingScaleLevel,
  configuredRows?: ScaleRow[],
): { grade: string; points: number } {
  if (configuredRows?.length) {
    const fromConfig = resolveGradeFromScaleRows(score, configuredRows);
    if (fromConfig) return fromConfig;
  }
  return hardcodedGrade(score, level);
}

/** @deprecated Use computeGradeForLevel(score, "A_LEVEL") */
export function computeUNEBGrade(score: number): { grade: string; points: number } {
  return computeGradeForLevel(score, "A_LEVEL");
}

export function computeGradeFromConfiguredScale(
  score: number,
  rows: ScaleRow[],
  level: GradingScaleLevel = "A_LEVEL",
): { grade: string; points: number } {
  return computeGradeForLevel(score, level, rows);
}

export function computeDivision(totalPoints: number): string {
  if (totalPoints <= 12) return "I";
  if (totalPoints <= 18) return "II";
  if (totalPoints <= 24) return "III";
  if (totalPoints <= 28) return "IV";
  return "Ungraded";
}
