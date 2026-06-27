import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateTermCompetencyLevel } from "../src/services/cbcCompetencyAggregation.js";

describe("aggregateTermCompetencyLevel", () => {
  it("returns the clear majority level", () => {
    const result = aggregateTermCompetencyLevel([
      "exceeds_expectations",
      "exceeds_expectations",
      "meets_expectations",
    ]);
    assert.deepEqual(result, { level: "exceeds_expectations", method: "most_frequent" });
  });

  it("breaks a two-way tie by preferring the higher-ranked level", () => {
    const result = aggregateTermCompetencyLevel([
      "exceeds_expectations",
      "meets_expectations",
      "exceeds_expectations",
      "meets_expectations",
    ]);
    assert.equal(result.level, "exceeds_expectations");
    assert.equal(result.method, "most_frequent");
  });

  it("breaks a three-way tie by preferring the highest rank", () => {
    const result = aggregateTermCompetencyLevel([
      "approaching_expectations",
      "meets_expectations",
      "exceeds_expectations",
    ]);
    assert.equal(result.level, "exceeds_expectations");
  });

  it("returns a single rating unchanged", () => {
    const result = aggregateTermCompetencyLevel(["meets_expectations"]);
    assert.deepEqual(result, { level: "meets_expectations", method: "most_frequent" });
  });

  it("throws on an empty array", () => {
    assert.throws(
      () => aggregateTermCompetencyLevel([]),
      /Cannot aggregate an empty rating set/,
    );
  });
});
