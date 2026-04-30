/** UNEB A-Level score ranges → grade & points (SRS table) */
export const UNEB_GRADE_TABLE = [
  { min: 80, max: 100, grade: "A", points: 1, descriptor: "Distinction" },
  { min: 75, max: 79, grade: "B", points: 2, descriptor: "Very Good" },
  { min: 65, max: 74, grade: "C", points: 3, descriptor: "Credit" },
  { min: 60, max: 64, grade: "D", points: 4, descriptor: "Pass" },
  { min: 55, max: 59, grade: "E", points: 5, descriptor: "Partial Pass" },
  { min: 45, max: 54, grade: "O", points: 7, descriptor: "Ordinary Level" }, // 6–8 range → midpoint 7
  { min: 0, max: 44, grade: "F", points: 9, descriptor: "Failure" },
] as const;

export const CBC_RATING_DESCRIPTORS: Record<string, string> = {
  A: "Exceptional",
  B: "Satisfactory",
  C: "Basic",
  D: "Needs Improvement",
};
