import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateTermLetterGrade } from "@uganda-cbc-sms/shared";

describe("aggregateTermLetterGrade", () => {
  it("returns the clear majority grade", () => {
    const result = aggregateTermLetterGrade(["A", "A", "B"]);
    assert.deepEqual(result, { grade: "A", method: "most_frequent" });
  });

  it("breaks a two-way tie by preferring the higher-ranked letter", () => {
    const result = aggregateTermLetterGrade(["A", "B", "A", "B"]);
    assert.equal(result.grade, "A");
    assert.equal(result.method, "most_frequent");
  });

  it("breaks a three-way tie by preferring the highest rank", () => {
    const result = aggregateTermLetterGrade(["C", "B", "A"]);
    assert.equal(result.grade, "A");
  });

  it("breaks a five-way tie by preferring A (rank 5)", () => {
    const result = aggregateTermLetterGrade(["E", "D", "C", "B", "A"]);
    assert.equal(result.grade, "A");
  });

  it("prefers B over C and D when counts are equal among three mid grades", () => {
    const result = aggregateTermLetterGrade(["B", "C", "D", "B", "C", "D"]);
    assert.equal(result.grade, "B");
  });

  it("returns a single rating unchanged", () => {
    const result = aggregateTermLetterGrade(["C"]);
    assert.deepEqual(result, { grade: "C", method: "most_frequent" });
  });

  it("throws on an empty array", () => {
    assert.throws(
      () => aggregateTermLetterGrade([]),
      /Cannot aggregate an empty grade set/,
    );
  });
});
