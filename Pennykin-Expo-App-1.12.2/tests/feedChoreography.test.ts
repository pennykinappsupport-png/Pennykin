import assert from "node:assert/strict";
import test from "node:test";
import { FEED_VISUAL_MS, FEED_EAT_MS, FEED_REACH_MS, FEED_GROOM_MS, FEED_PET_LICK_MS } from "../src/careChoreography";
import { FEED_BOWL_HIDE_MS, FEED_RETURN_MS, FEED_MOTION_INPUT, FEED_BODY_PATH, FEED_BOWL_PATH, feedBodyAt, feedBowlAt, feedSnapshot } from "../src/feedChoreography";
import { FEED_FOOD_START_MS, FEED_FIRST_BLEND_MS, FEED_SPEECH_MS, FEED_CROSSFADE_MS, FEED_TRANSITIONS, FEED_PICKUP_SCALE, feedPickupScaleAt, feedWeightsAt, feedSpeechAt } from "../src/feedChoreography";

test("dog/rabbit keep an expectation beat before reaching, eating and licking", () => {
  const at = (ms: number) => feedSnapshot(ms / FEED_VISUAL_MS);
  assert.equal(at(0).pose, null);
  assert.equal(at(FEED_FIRST_BLEND_MS - 1).expecting, true);
  assert.equal(at(FEED_FIRST_BLEND_MS).expecting, false);
  assert.equal(at(149).blinking, false);
  assert.equal(at(150).blinking, true);
  assert.equal(at(260).blinking, false);
  assert.equal(at(FEED_REACH_MS).pose, 0);
  assert.equal(at(FEED_EAT_MS).pose, 1);
  assert.equal(at(FEED_GROOM_MS).pose, 2);
  assert.equal(at(FEED_PET_LICK_MS).pose, 4);
  assert.equal(at(FEED_RETURN_MS).pose, null);
});

test("the independent bowl is retired before the embedded bowl and never resurrects", () => {
  assert.ok(FEED_BOWL_HIDE_MS < FEED_EAT_MS);
  for (let ms = FEED_BOWL_HIDE_MS; ms <= FEED_VISUAL_MS + 3000; ms += 10) {
    assert.equal(feedBowlAt(ms).opacity, 0);
    assert.equal(feedSnapshot(ms / FEED_VISUAL_MS).bowlVisible, false);
  }
  for (let ms = 0; ms <= FEED_VISUAL_MS; ms += 1) {
    const state = feedSnapshot(ms / FEED_VISUAL_MS);
    if (state.pose === 1 || state.pose === 2 || state.pose === 4) {
      assert.equal(state.bowlVisible, false);
      assert.equal(feedBowlAt(ms).opacity, 0);
    }
  }
});

test("preparation compresses downward before a substantial spring overshoot", () => {
  const crouch = feedBodyAt(380);
  assert.ok(crouch.sy <= 0.87 && crouch.sx >= 1.08 && crouch.y > 0);
  assert.equal(feedSnapshot(380 / FEED_VISUAL_MS).pose, null);
  const recoil = FEED_BODY_PATH.slice(48, 82);
  assert.ok(recoil.some((p) => p.sy > 1.03));
  assert.ok(recoil.some((p) => p.y < 0));
  assert.ok(FEED_BOWL_PATH.slice(0, 65).some((p) => p.scale > 1.03));
});

test("eating has four crisp head dips followed by decaying mouth-wipe recoil", () => {
  for (let i = 0; i < 4; i++) {
    const start = FEED_EAT_MS + i * 120;
    assert.ok(feedBodyAt(start + 52).sy < feedBodyAt(start).sy);
    assert.ok(feedBodyAt(start + 52).y > feedBodyAt(start).y);
  }
  const early = Math.max(...FEED_BODY_PATH.slice(145, 165).map((p) => Math.abs(p.rotation)));
  const late = Math.max(...FEED_BODY_PATH.slice(175, 185).map((p) => Math.abs(p.rotation)));
  assert.ok(early > late && early > 1);
});

test("completion explicitly clears Feed art, prop, expression and body transforms", () => {
  for (const p of [1, 1.01, 2]) {
    assert.deepEqual(feedSnapshot(p), { pose: null, complete: true, expecting: false, blinking: false, bowlVisible: false });
    assert.deepEqual(feedBodyAt(p * FEED_VISUAL_MS), { x: 0, y: 0, sx: 1, sy: 1, rotation: 0 });
  }
  // A new action starts with neither a held bowl nor the previous lick pose.
  assert.equal(feedSnapshot(0).pose, null);
  assert.equal(feedBowlAt(0).opacity, 0);
});

test("native Feed samples are finite, bounded and strictly ordered", () => {
  assert.equal(FEED_MOTION_INPUT[0], 0);
  assert.equal(FEED_MOTION_INPUT.at(-1), 1);
  assert.equal(FEED_MOTION_INPUT.length, FEED_BODY_PATH.length);
  assert.equal(FEED_MOTION_INPUT.length, FEED_BOWL_PATH.length);
  for (let i = 0; i < FEED_MOTION_INPUT.length; i++) {
    if (i) assert.ok(FEED_MOTION_INPUT[i]! > FEED_MOTION_INPUT[i - 1]!);
    const body = FEED_BODY_PATH[i]!;
    const bowl = FEED_BOWL_PATH[i]!;
    assert.ok(Object.values(body).every(Number.isFinite) && Object.values(bowl).every(Number.isFinite));
    assert.ok(body.sx > 0.85 && body.sx < 1.15 && body.sy > 0.8 && body.sy < 1.15);
    assert.ok(bowl.opacity >= 0 && bowl.opacity <= 1);
  }
});

test("food, first pose blend and speech start 100–200 milliseconds apart", () => {
  for (const delay of [FEED_FIRST_BLEND_MS - FEED_FOOD_START_MS, FEED_SPEECH_MS - FEED_FIRST_BLEND_MS]) {
    assert.ok(delay >= 100 && delay <= 200);
  }
  assert.equal(feedBowlAt(FEED_FOOD_START_MS).opacity, 0);
  assert.ok(feedBowlAt(FEED_FOOD_START_MS + 50).opacity > 0);
  assert.deepEqual(feedWeightsAt(FEED_FIRST_BLEND_MS), [1, 0, 0, 0, 0]);
  assert.equal(feedSpeechAt(FEED_SPEECH_MS).opacity, 0);
  assert.ok(feedSpeechAt(FEED_SPEECH_MS + 60).opacity > 0);
});

test("every Feed crossfade conserves total opacity with at most two adjacent poses", () => {
  for (let ms = 0; ms <= FEED_VISUAL_MS + 1000; ms += 1) {
    const weights = feedWeightsAt(ms);
    assert.ok(weights.every((w) => w >= 0 && w <= 1));
    assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-10);
    assert.ok(weights.filter((w) => w > 0).length <= 2);
    if (weights[2]! > 0 || weights[3]! > 0 || weights[4]! > 0) assert.equal(feedBowlAt(ms).opacity, 0);
  }
  assert.deepEqual(feedWeightsAt(FEED_VISUAL_MS), [1, 0, 0, 0, 0]);
});

test("each blend changes continuously and speech has a gentle overshoot", () => {
  for (const change of FEED_TRANSITIONS) {
    const half = feedWeightsAt(change.at + change.duration / 2);
    assert.equal(half[change.from], 0.5);
    assert.equal(half[change.to], 0.5);
    const before = feedWeightsAt(change.at - 0.001);
    const after = feedWeightsAt(change.at + 0.001);
    for (let i = 0; i < 5; i++) assert.ok(Math.abs(before[i]! - after[i]!) < 1e-5);
  }
  assert.ok(Array.from({ length: 50 }, (_, i) => feedSpeechAt(FEED_SPEECH_MS + i * 10).scale).some((scale) => scale > 1));
});

test("Idle-to-Feed and Feed-to-Idle each retain both images for a complete 300ms blend", () => {
  assert.equal(FEED_CROSSFADE_MS, 300);
  for (const change of [FEED_TRANSITIONS[0], FEED_TRANSITIONS.at(-1)!]) {
    assert.equal(change.duration, 300);
    assert.equal(feedWeightsAt(change.at)[change.from], 1);
    const mid = feedWeightsAt(change.at + 150);
    assert.equal(mid[change.from], 0.5);
    assert.equal(mid[change.to], 0.5);
    const last = feedWeightsAt(change.at + 299);
    assert.ok(last[change.from]! > 0 && last[change.to]! < 1);
    assert.equal(feedWeightsAt(change.at + 300)[change.to], 1);
  }
  const exit = FEED_TRANSITIONS.at(-1)!;
  assert.equal(exit.at + exit.duration, FEED_VISUAL_MS);
  for (let i = 1; i < FEED_TRANSITIONS.length; i++) {
    const previous = FEED_TRANSITIONS[i - 1]!;
    assert.ok(previous.at + previous.duration <= FEED_TRANSITIONS[i]!.at);
  }
});

test("pickup adds a 1.05 scale pulse and springs back without retaining a scale", () => {
  assert.equal(FEED_PICKUP_SCALE, 1.05);
  assert.equal(feedPickupScaleAt(FEED_FIRST_BLEND_MS), 1);
  assert.equal(feedPickupScaleAt(FEED_FIRST_BLEND_MS + 70), 1.05);
  const samples = Array.from({ length: 191 }, (_, i) => feedPickupScaleAt(i * 10));
  assert.ok(samples.every((scale) => Number.isFinite(scale) && scale >= 0.98 && scale <= 1.05));
  assert.ok(samples.some((scale) => scale < 1));
  assert.ok(Math.abs(feedPickupScaleAt(1500) - 1) < 0.0001);
  assert.equal(feedPickupScaleAt(FEED_VISUAL_MS), 1);
  assert.equal(feedPickupScaleAt(FEED_VISUAL_MS + 1000), 1);
});
