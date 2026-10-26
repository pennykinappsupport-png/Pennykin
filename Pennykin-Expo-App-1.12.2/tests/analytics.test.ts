import assert from "node:assert/strict";
import test from "node:test";
import { compareSpending, getPeriodOffsetForDate } from "../src/analytics";
const now = new Date(2026, 8, 24, 15, 0, 0);

test("period comparison reports lower, higher, unchanged, and missing baselines", () => {
  assert.deepEqual(compareSpending(8800, 10_000), { direction: "lower", percent: 12 });
  assert.deepEqual(compareSpending(11_500, 10_000), { direction: "higher", percent: 15 });
  assert.deepEqual(compareSpending(10_000, 10_000), { direction: "same", percent: 0 });
  assert.deepEqual(compareSpending(500, 0), { direction: "new", percent: null });
  assert.deepEqual(compareSpending(0, 0), { direction: "none", percent: null });
});

test("calendar dates jump directly to the matching day, week, month, or year", () => {
  const selected = new Date(2026, 7, 1, 12);
  assert.equal(getPeriodOffsetForDate("day", selected, now), -54);
  assert.equal(getPeriodOffsetForDate("week", selected, now), -8);
  assert.equal(getPeriodOffsetForDate("month", selected, now), -1);
  assert.equal(getPeriodOffsetForDate("year", selected, now), 0);
});
