import assert from "node:assert/strict";
import test from "node:test";

import { canPetBlink, selectPetFrame, type PetPoseReadiness } from "../src/petPose";
import type { PetVisualState } from "../src/types";

const ready: PetPoseReadiness = { blink: true, eat: true, play: true, rest: true };
const staleFrames = { blinkClosed: true, chewing: true, toyCaught: true };

test("blinking and four chew cycles keep the same body continuously visible", () => {
  for (const state of ["calm", "eating"] as const) {
    for (let frame = 0; frame < 8; frame += 1) {
      const active = frame % 2 === 0;
      const selected = selectPetFrame(state, ready, { ...staleFrames, blinkClosed: active, chewing: active });
      assert.equal(selected.body, "base");
      assert.equal(selected.face, active ? state === "eating" ? "eat" : "blink" : null);
    }
  }
});

test("Play never selects a legacy bitmap containing a second toy", () => {
  assert.deepEqual(selectPetFrame("playing", ready, { ...staleFrames, toyCaught: false }), { body: "base", face: null });
  assert.deepEqual(selectPetFrame("playing", ready, staleFrames), { body: "base", face: null });
});

test("Clean and sleep ignore stale Feed, Play and blink frames", () => {
  assert.deepEqual(selectPetFrame("bathing", ready, staleFrames), { body: "base", face: null });
  assert.deepEqual(selectPetFrame("sleeping", ready, staleFrames), { body: "rest", face: null });
  for (const state of ["eating", "playing", "bathing", "sleeping"] as const) assert.equal(canPetBlink(state), false);
});

test("unloaded or failed alternate art preserves the standing body without a facial patch", () => {
  const unavailable: PetPoseReadiness = { blink: false, eat: false, play: false, rest: false };
  for (const state of ["eating", "playing", "sleeping", "bathing", "calm"] as const) {
    assert.deepEqual(selectPetFrame(state, unavailable, staleFrames), { body: "base", face: null });
  }
});

test("care actions return to sleep or idle without retaining a facial frame", () => {
  for (const action of ["eating", "playing", "bathing"] as const) {
    selectPetFrame(action, ready, staleFrames);
    assert.deepEqual(selectPetFrame("sleeping", ready, staleFrames), { body: "rest", face: null });
    assert.deepEqual(selectPetFrame("calm", ready, { ...staleFrames, blinkClosed: false }), { body: "base", face: null });
  }
});

test("rapid action transitions cannot show care facial art on another body pose", () => {
  const sequence: PetVisualState[] = ["playing", "bathing", "eating", "sleeping", "celebrate", "calm"];
  assert.deepEqual(sequence.map((state) => selectPetFrame(state, ready, staleFrames)), [
    { body: "base", face: null }, { body: "base", face: null }, { body: "base", face: "eat" },
    { body: "rest", face: null }, { body: "base", face: "blink" }, { body: "base", face: "blink" },
  ]);
});

test("Vet uses its own emotional poses without stale Feed, Play or blink overlays", () => {
  assert.equal(canPetBlink("vet"), false);
  assert.deepEqual(selectPetFrame("vet", ready, staleFrames), { body: "base", face: null });
});
