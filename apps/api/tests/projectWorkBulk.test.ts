import { partitionProjectWorkScores } from "../src/modules/assessments/projectWorkBulk.js";

const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";

describe("partitionProjectWorkScores", () => {
  it("dedupes upserts and keeps the last score per slot", () => {
    const { upserts, deletes } = partitionProjectWorkScores([
      { studentId: S1, projectNumber: 1, score: 40 },
      { studentId: S1, projectNumber: 1, score: 55 },
      { studentId: S2, projectNumber: 2, score: 70, maxScore: 50 },
    ]);

    expect(deletes).toHaveLength(0);
    expect(upserts).toHaveLength(2);
    expect(upserts.find((u) => u.studentId === S1 && u.projectNumber === 1)?.score).toBe(55);
    expect(upserts.find((u) => u.studentId === S2)?.maxScore).toBe(50);
  });

  it("routes null scores to deletes and removes conflicting upserts", () => {
    const { upserts, deletes } = partitionProjectWorkScores([
      { studentId: S1, projectNumber: 1, score: 40 },
      { studentId: S1, projectNumber: 1, score: null },
    ]);

    expect(upserts).toHaveLength(0);
    expect(deletes).toEqual([{ studentId: S1, projectNumber: 1 }]);
  });
});
