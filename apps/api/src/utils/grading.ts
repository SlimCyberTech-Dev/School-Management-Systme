/** UNEB A-Level grade from score (exact SRS table) */
export function computeUNEBGrade(score: number): { grade: string; points: number } {
  if (score >= 80) return { grade: "A", points: 1 };
  if (score >= 75) return { grade: "B", points: 2 };
  if (score >= 65) return { grade: "C", points: 3 };
  if (score >= 60) return { grade: "D", points: 4 };
  if (score >= 55) return { grade: "E", points: 5 };
  if (score >= 45) return { grade: "O", points: 6 };
  return { grade: "F", points: 9 };
}

/** Division from total points (combination aggregate) */
export function computeDivision(totalPoints: number): string {
  if (totalPoints <= 12) return "I";
  if (totalPoints <= 18) return "II";
  if (totalPoints <= 24) return "III";
  if (totalPoints <= 28) return "IV";
  return "Ungraded";
}

// Backward-compatible aliases.
export const getUnebGrade = computeUNEBGrade;
export const getDivision = computeDivision;

/** CBC rating descriptor */
export function getCbcDescriptor(rating: string): string {
  const map: Record<string, string> = {
    A: "Exceptional",
    B: "Satisfactory",
    C: "Basic",
    D: "Needs Improvement",
  };
  return map[rating] ?? "";
}
