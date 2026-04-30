/** UNEB A-Level grade from score (exact SRS table) */
export function getUnebGrade(score: number): { grade: string; points: number } {
  if (score >= 80) return { grade: "A", points: 1 };
  if (score >= 75) return { grade: "B", points: 2 };
  if (score >= 65) return { grade: "C", points: 3 };
  if (score >= 60) return { grade: "D", points: 4 };
  if (score >= 55) return { grade: "E", points: 5 };
  if (score >= 45) return { grade: "O", points: 7 }; // midpoint of 6–8
  return { grade: "F", points: 9 };
}

/** Division from total points (best 3 subjects summed) */
export function getDivision(totalPoints: number): string {
  if (totalPoints >= 6 && totalPoints <= 12) return "Division I";
  if (totalPoints >= 13 && totalPoints <= 18) return "Division II";
  if (totalPoints >= 19 && totalPoints <= 24) return "Division III";
  if (totalPoints >= 25 && totalPoints <= 28) return "Division IV";
  return "Ungraded";
}

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
