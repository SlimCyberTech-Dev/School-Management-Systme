import { resolveMarkGrades } from "../src/modules/exams/examMarksBulk.js";

describe("resolveMarkGrades", () => {
  it("dedupes by student and keeps the last score", () => {
    const resolved = resolveMarkGrades(
      [
        { studentId: "11111111-1111-4111-8111-111111111111", score: 40 },
        { studentId: "11111111-1111-4111-8111-111111111111", score: 55 },
        { studentId: "22222222-2222-4222-8222-222222222222", score: 70 },
      ],
      (score) => ({ grade: score >= 50 ? "C" : "D", points: null }),
    );

    expect(resolved).toHaveLength(2);
    const first = resolved.find((r) => r.studentId === "11111111-1111-4111-8111-111111111111");
    expect(first?.score).toBe(55);
    expect(first?.grade).toBe("C");
  });
});
