import assert from "node:assert/strict";
import test from "node:test";
import { ANIMAL_PLAY_VISUAL_MS, ANIMAL_PLAY_DURATION_MS, ANIMAL_PLAY_CATCH_MS, ANIMAL_PLAY_LAND_MS, ANIMAL_PLAY_RELEASE_MS, ANIMAL_PLAY_ROLL_MS, ANIMAL_PLAY_TOY_END_MS, ANIMAL_PLAY_FADE_MS, ANIMAL_PLAY_POSE_EVENTS, ANIMAL_PLAY_INPUT, animalPlayWeights, animalPlayBody, animalPlayToy, animalHeldPoint, animalPlaySnapshot, animalPlayToyOpacity } from "../src/animalPlayChoreography";
import { phaseDurationMs, initialPetAnimationState, petAnimationReducer } from "../src/petAnimationMachine";

test("dog/rabbit ball enters from outside, bounces twice with diminishing height, and stops for the pounce", () => {
  assert.ok(animalPlayToy(0).x < -1);
  assert.ok(animalPlayToy(300).y < .6);
  for (const ms of [600, 920, 1160, 1400]) assert.equal(animalPlayToy(ms).y, .875);
  assert.ok(animalPlayToy(760).y < animalPlayToy(1040).y);
  assert.ok(animalPlayToy(760).y < .875 && animalPlayToy(1040).y < .875);
  assert.ok(animalPlayToy(600).x < animalPlayToy(920).x && animalPlayToy(920).x < animalPlayToy(1160).x);
});
test("the two running steps precede crouch, airborne stretch and damped landing", () => {
  assert.ok(animalPlayBody(665).y < 0 && animalPlayBody(995).y < 0);
  assert.ok(animalPlayBody(500).x < animalPlayBody(1160).x);
  assert.ok(animalPlayBody(1300).sy < .9);
  assert.ok(animalPlayBody(1660).sy > 1.13 && animalPlayBody(1660).y < -.16);
  assert.ok(animalPlayBody(ANIMAL_PLAY_LAND_MS + 45).sy < .88);
  assert.ok(animalPlayBody(ANIMAL_PLAY_LAND_MS + 160).sy > 1);
  for (const at of [500, 1160, 1440, ANIMAL_PLAY_LAND_MS, 2200, 2920, 3820, ANIMAL_PLAY_VISUAL_MS]) {
    const before = animalPlayBody(at - .001), after = animalPlayBody(at);
    for (const k of ["x", "y", "rotation", "sx", "sy"] as const) assert.ok(Math.abs(before[k] - after[k]) < .001, `${k} discontinuity at ${at}`);
  }
});
test("both species keep the single ball attached to their own hugging paws without boundary teleports", () => {
  for (const type of ["dog", "rabbit"] as const) {
    for (let ms = ANIMAL_PLAY_CATCH_MS; ms < ANIMAL_PLAY_RELEASE_MS; ms += 10) assert.deepEqual(animalPlayToy(ms, type), animalHeldPoint(ms, 0, type));
    for (const at of [600, 920, 1160, 1440, ANIMAL_PLAY_CATCH_MS, ANIMAL_PLAY_RELEASE_MS, ANIMAL_PLAY_ROLL_MS, ANIMAL_PLAY_TOY_END_MS]) {
      const a = animalPlayToy(at - .001, type), b = animalPlayToy(at, type);
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < .001, `${type} toy jumped at ${at}`);
    }
    assert.ok(animalPlayToy(ANIMAL_PLAY_TOY_END_MS, type).x > 2);
  }
  assert.notDeepEqual(animalHeldPoint(2000, 0, "dog"), animalHeldPoint(2000, 0, "rabbit"));
});
test("all 260ms crossfades include entry and exit, preserve opacity and never leave a third body", () => {
  assert.equal(ANIMAL_PLAY_FADE_MS, 260);
  for (const [at, layer] of ANIMAL_PLAY_POSE_EVENTS) {
    const half = animalPlayWeights(at + 130);
    assert.equal(half[layer], .5);
    assert.equal(animalPlayWeights(at + 260)[layer], 1);
  }
  for (let ms = 0; ms <= ANIMAL_PLAY_VISUAL_MS; ms++) {
    const w = animalPlayWeights(ms);
    assert.ok(Math.abs(w.reduce((a, b) => a + b) - 1) < 1e-10);
    assert.ok(w.filter(x => x > 0).length <= 2);
  }
  assert.deepEqual(animalPlayWeights(ANIMAL_PLAY_VISUAL_MS), [1, 0, 0, 0, 0, 0, 0]);
});
test("completion retires every temporary prop and returns the rig to idle before its owner finishes", () => {
  assert.deepEqual(animalPlayBody(ANIMAL_PLAY_VISUAL_MS), { x: 0, y: 0, rotation: 0, sx: 1, sy: 1 });
  assert.deepEqual(animalPlaySnapshot(1), { pose: null, caught: false, complete: true, message: "Yay! Let's play again soon!" });
  for (const t of [ANIMAL_PLAY_TOY_END_MS, ANIMAL_PLAY_VISUAL_MS, 10000]) assert.equal(animalPlayToyOpacity(t), 0);
  let owner = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: { id: "animal-play", state: "playing", durationMs: ANIMAL_PLAY_DURATION_MS, message: "play", priority: "interaction" } });
  const start = phaseDurationMs(owner)!;
  owner = petAnimationReducer(owner, { type: "ADVANCE" });
  const playing = phaseDurationMs(owner)!;
  owner = petAnimationReducer(owner, { type: "ADVANCE" });
  assert.ok(start + playing + phaseDurationMs(owner)! >= ANIMAL_PLAY_VISUAL_MS);
  assert.equal(ANIMAL_PLAY_INPUT[0], 0); assert.equal(ANIMAL_PLAY_INPUT.at(-1), 1);
  for (let i = 1; i < ANIMAL_PLAY_INPUT.length; i++) assert.ok(ANIMAL_PLAY_INPUT[i]! > ANIMAL_PLAY_INPUT[i - 1]!);
});
