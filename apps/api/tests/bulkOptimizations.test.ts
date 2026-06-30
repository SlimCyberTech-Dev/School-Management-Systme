import { dedupeAttendanceRows, summarizeAttendanceRows } from "../src/modules/attendance/attendanceRegisterBulk.js";
import { dedupeAlevelScores } from "../src/modules/assessments/alevelBulk.js";
import { partitionExamEntries } from "../src/modules/exams/examEntriesBulk.js";

const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";
const SUB1 = "33333333-3333-4333-8333-333333333333";

describe("dedupeAttendanceRows", () => {
  it("keeps the last status per student", () => {
    const rows = dedupeAttendanceRows([
      { studentId: S1, status: "present" },
      { studentId: S1, status: "absent" },
      { studentId: S2, status: "late" },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.studentId === S1)?.status).toBe("absent");
  });
});

describe("summarizeAttendanceRows", () => {
  it("counts present, absent, and late", () => {
    expect(
      summarizeAttendanceRows([
        { studentId: S1, status: "present" },
        { studentId: S2, status: "absent" },
        { studentId: "44444444-4444-4444-8444-444444444444", status: "late" },
      ]),
    ).toEqual({
      total: 3,
      present: 1,
      absent: 1,
      late: 1,
      unmarked: 0,
    });
  });
});

describe("dedupeAlevelScores", () => {
  it("keeps the last score per student and subject", () => {
    const rows = dedupeAlevelScores([
      { studentId: S1, subjectId: SUB1, score: 40 },
      { studentId: S1, subjectId: SUB1, score: 55 },
    ]);
    expect(rows).toEqual([{ studentId: S1, subjectId: SUB1, score: 55 }]);
  });
});

describe("partitionExamEntries", () => {
  it("routes entered rows to inserts and cleared rows to removes", () => {
    const { inserts, removes } = partitionExamEntries([
      { studentId: S1, subjectId: SUB1, isEntered: true },
      { studentId: S2, subjectId: SUB1, isEntered: false },
      { studentId: S1, subjectId: SUB1, isEntered: false },
    ]);
    expect(inserts).toHaveLength(0);
    expect(removes).toEqual([
      { studentId: S2, subjectId: SUB1 },
      { studentId: S1, subjectId: SUB1 },
    ]);
  });
});
