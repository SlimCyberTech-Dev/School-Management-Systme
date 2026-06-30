import { describe, expect, it } from "@jest/globals";
import {
  computeTermExamAverage,
  computeTermProjectAverage,
  computeTermCompositeScore,
  computeTermSubjectGrade,
  DEFAULT_ASSESSMENT_CONFIG,
  DEFAULT_ASSESSMENT_GRADING_SCALES,
} from "@uganda-cbc-sms/shared";

const O_LEVEL_BANDS = DEFAULT_ASSESSMENT_GRADING_SCALES.O_LEVEL.map((r) => ({
  ...r,
  isActive: true,
}));

describe("termSubjectGrading", () => {
  it("averages only compulsory exams", () => {
    const { average, breakdown } = computeTermExamAverage([
      { examId: "1", examName: "CAT 1", score: 80, maxScore: 100, isCompulsory: true },
      { examId: "2", examName: "CAT 2", score: 60, maxScore: 100, isCompulsory: true },
      { examId: "3", examName: "Practice", score: 100, maxScore: 100, isCompulsory: false },
    ]);
    expect(average).toBe(70);
    expect(breakdown).toHaveLength(2);
  });

  it("computes mean of three compulsory exams", () => {
    const { average } = computeTermExamAverage([
      { examId: "1", examName: "C1", score: 50, maxScore: 100, isCompulsory: true },
      { examId: "2", examName: "C2", score: 80, maxScore: 100, isCompulsory: true },
      { examId: "3", examName: "C3", score: 100, maxScore: 100, isCompulsory: true },
    ]);
    expect(average).toBeCloseTo(76.67, 1);
  });

  it("blends project and exam with 20/80 weights", () => {
    const config = { ...DEFAULT_ASSESSMENT_CONFIG, includeProjectWorkInTermGrade: true };
    const composite = computeTermCompositeScore(80, 60, config);
    expect(composite).toBe(76);
  });

  it("uses exam average only when project work disabled", () => {
    const config = { ...DEFAULT_ASSESSMENT_CONFIG, includeProjectWorkInTermGrade: false };
    const composite = computeTermCompositeScore(81, 60, config);
    expect(composite).toBe(81);
  });

  it("maps composite to A-E grade band", () => {
    const result = computeTermSubjectGrade(
      {
        examMarks: [
          { examId: "1", examName: "EOT", score: 85, maxScore: 100, isCompulsory: true },
        ],
        projectScores: [],
        config: { ...DEFAULT_ASSESSMENT_CONFIG, includeProjectWorkInTermGrade: false },
      },
      O_LEVEL_BANDS,
    );
    expect(result.finalGrade).toBe("A");
    expect(result.compositeScore).toBe(85);
  });

  it("computes term project average", () => {
    const avg = computeTermProjectAverage([
      { score: 40, maxScore: 100 },
      { score: 60, maxScore: 100 },
    ]);
    expect(avg).toBe(50);
  });
});
