import assert from "node:assert/strict";
import test from "node:test";
import { petCareFrame, feedBowlIsEmbedded, FEED_PET_LICK_MS } from "../src/careChoreography";

import { BATH_WIPE_END, BATH_WIPE_START, canIdleFidget, catCareFrame, feedStage, FEED_BODY_SPRING, FEED_BOWL_SPRING, FEED_GROOM_SPRING, FEED_CHEW_MS, FEED_PREP_SQUASH_MS, FEED_DURATION_MS, FEED_VISUAL_MS, FEED_REACH_MS, FEED_EAT_MS, FEED_GROOM_MS, isWipingFace } from "../src/careChoreography";

test("Feed leaves enough time for anticipation and complete 300ms pose crossfades", () => {
  assert.ok(FEED_DURATION_MS <= 2300);
  assert.ok(FEED_VISUAL_MS < FEED_DURATION_MS);
  assert.ok(FEED_REACH_MS >= 300);
  assert.ok(FEED_VISUAL_MS - FEED_GROOM_MS >= 400);
  assert.deepEqual([0, FEED_REACH_MS - 1, FEED_REACH_MS, FEED_EAT_MS - 1, FEED_EAT_MS, FEED_GROOM_MS - 1, FEED_GROOM_MS, FEED_VISUAL_MS].map((time) => feedStage(time / FEED_VISUAL_MS)), ["expect", "expect", "receive", "receive", "eat", "eat", "groom", "groom"]);
});

test("the care atlas selects one ordered Feed pose and returns to no care pose", () => {
  const flags = { reaching: false, eating: false, grooming: false, wipeStarted: false, wipeEnded: false };
  assert.equal(catCareFrame("eating", true, flags, true), null);
  assert.equal(catCareFrame("eating", true, { ...flags, reaching: true }, true), 0);
  assert.equal(catCareFrame("eating", true, { ...flags, reaching: true, eating: true }, true), 1);
  assert.equal(catCareFrame("eating", true, { ...flags, reaching: true, eating: true, grooming: true }, true), 4);
  assert.equal(catCareFrame("calm", true, { ...flags, reaching: true, eating: true, grooming: true }, true), null);
});

test("washing enters a bounded wipe stage and then returns to rinsing", () => {
  assert.equal(isWipingFace(0), false);
  assert.equal(isWipingFace(BATH_WIPE_START), true);
  assert.equal(isWipingFace(0.65), true);
  assert.equal(isWipingFace(BATH_WIPE_END), false);
  assert.equal(isWipingFace(1), false);
});

test("idle ear movements cannot run during care, rewards or sleep", () => {
  assert.equal(canIdleFidget("calm", false), true);
  assert.equal(canIdleFidget("curious", false), true);
  for (const state of ["eating", "bathing", "playing", "vet", "sleeping", "gift", "celebrate"] as const) assert.equal(canIdleFidget(state, false), false);
  assert.equal(canIdleFidget("calm", true), false);
});

test("unready care art always retains the existing pet body fallback", () => {
  const flags = { reaching: true, eating: true, grooming: true, wipeStarted: true, wipeEnded: false };
  assert.equal(catCareFrame("eating", false, flags), null);
  assert.equal(catCareFrame("bathing", false, flags), null);
});

test("wipe flags do not leak into Play or sleep, and finished wipes stop", () => {
  const flags = { reaching: false, eating: false, grooming: false, wipeStarted: true, wipeEnded: false };
  assert.equal(catCareFrame("bathing", true, flags), 3);
  assert.equal(catCareFrame("bathing", true, { ...flags, wipeEnded: true }), null);
  assert.equal(catCareFrame("sleeping", true, flags), null);
  assert.equal(catCareFrame("playing", true, flags), null);
});

test("missing lick artwork falls back to satisfaction without borrowing the sponge pose", () => {
  const flags = { reaching: true, eating: true, grooming: true, wipeStarted: true, wipeEnded: false };
  assert.equal(catCareFrame("eating", true, flags, false), 2);
  assert.equal(catCareFrame("eating", true, flags, true), 4);
  assert.equal(catCareFrame("bathing", true, flags, true), 3);
  assert.equal(catCareFrame("playing", true, flags, true), null);
});

test("body and bowl springs remain underdamped so overshoot is possible", () => {
  for (const spring of [FEED_BODY_SPRING, FEED_BOWL_SPRING, FEED_GROOM_SPRING]) {
    const dampingRatio = spring.damping / (2 * Math.sqrt(spring.stiffness * spring.mass));
    assert.ok(dampingRatio > 0 && dampingRatio < 1);
  }
});


test("Feed uses a slow preparation, four fast chews, and room for a damped ending", () => {
  const oneChew = Object.values(FEED_CHEW_MS).reduce((sum, time) => sum + time, 0);
  assert.ok(FEED_PREP_SQUASH_MS > oneChew * 2);
  assert.ok(FEED_CHEW_MS.down < FEED_CHEW_MS.up);
  assert.ok(FEED_EAT_MS + oneChew * 4 <= FEED_GROOM_MS);
  assert.ok(FEED_VISUAL_MS - FEED_GROOM_MS > oneChew * 4);
});

test("dog and rabbit Feed shows receive, eat, satisfaction then lick and clears on idle", () => {
  const flags = { reaching: false, eating: false, satisfied: false, licking: false, wipeStarted: false, wipeEnded: false };
  assert.equal(petCareFrame("eating", true, flags), null);
  assert.equal(petCareFrame("eating", true, { ...flags, reaching: true }), 0);
  assert.equal(petCareFrame("eating", true, { ...flags, reaching: true, eating: true }), 1);
  assert.equal(petCareFrame("eating", true, { ...flags, reaching: true, eating: true, satisfied: true }), 2);
  const ended = { ...flags, reaching: true, eating: true, satisfied: true, licking: true };
  assert.equal(petCareFrame("eating", true, ended), 4);
  for (const state of ["calm", "curious", "playing", "sleeping", "vet"] as const) assert.equal(petCareFrame(state, true, ended), null);
  assert.ok(FEED_PET_LICK_MS - FEED_GROOM_MS >= 100);
  assert.ok(FEED_VISUAL_MS - FEED_PET_LICK_MS >= 400);
});

test("dog and rabbit wipe is bounded and never used as the Feed finale", () => {
  const flags = { reaching: true, eating: true, satisfied: true, licking: true, wipeStarted: true, wipeEnded: false };
  assert.equal(petCareFrame("bathing", true, flags), 3);
  assert.equal(petCareFrame("bathing", true, { ...flags, wipeEnded: true }), null);
  assert.equal(petCareFrame("eating", true, flags), 4);
});

test("missing dog/rabbit care art retains the existing body fallback", () => {
  const flags = { reaching: true, eating: true, satisfied: true, licking: true, wipeStarted: true, wipeEnded: false };
  assert.equal(petCareFrame("eating", false, flags), null);
  assert.equal(petCareFrame("bathing", false, flags), null);
});

test("external bowl is hidden in exactly the same frame that a held bowl or lick is selected", () => {
  const flags = { reaching: true, eating: false, satisfied: false, licking: false, wipeStarted: false, wipeEnded: false };
  assert.equal(feedBowlIsEmbedded(petCareFrame("eating", true, flags)), false);
  for (const next of [{ ...flags, eating: true }, { ...flags, satisfied: true }, { ...flags, licking: true }]) {
    assert.equal(feedBowlIsEmbedded(petCareFrame("eating", true, next)), true);
  }
  assert.equal(feedBowlIsEmbedded(petCareFrame("eating", false, { ...flags, eating: true })), false);
  assert.equal(feedBowlIsEmbedded(3), false);
});
