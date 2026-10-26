import assert from "node:assert/strict";
import test from "node:test";

import {
  initialPetAnimationState,
  petAnimationReducer,
  phaseDurationMs,
  type PetAnimationRequest,
} from "../src/petAnimationMachine";

function request(id: string, priority: PetAnimationRequest["priority"] = "interaction"): PetAnimationRequest {
  return { id, durationMs: 1200, message: id, priority, state: id === "gift" ? "gift" : "playing" };
}

test("moves through idle, starting, playing, finishing, and idle", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("play") });
  assert.equal(state.phase, "starting");
  assert.equal(phaseDurationMs(state), 140);
  state = petAnimationReducer(state, { type: "ADVANCE" });
  assert.equal(state.phase, "playing");
  assert.equal(phaseDurationMs(state), 840);
  state = petAnimationReducer(state, { type: "ADVANCE" });
  assert.equal(state.phase, "finishing");
  state = petAnimationReducer(state, { type: "ADVANCE" });
  assert.deepEqual(state, initialPetAnimationState);
});

test("blocks repeated care animations while one is active", () => {
  const active = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("play") });
  const unchanged = petAnimationReducer(active, { type: "REQUEST", request: request("second-care") });
  assert.equal(unchanged, active);
  assert.equal(unchanged.queue.length, 0);
});

test("every rapid tap updates the active hello without a growing queue", () => {
  let state = initialPetAnimationState;
  for (let i = 0; i < 50; i += 1) {
    const previous = state;
    state = petAnimationReducer(state, { type: "REQUEST", request: request(`tap-${i}`, "tap") });
    assert.notEqual(state, previous);
    assert.equal(state.active?.id, `tap-${i}`);
    assert.equal(state.queue.length, 0);
  }
});

test("tapping during care preserves care and defers only the newest hello", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("feed") });
  state = petAnimationReducer(state, { type: "ADVANCE" });
  for (let i = 0; i < 20; i += 1) {
    state = petAnimationReducer(state, { type: "REQUEST", request: request(`tap-${i}`, "tap") });
    assert.equal(state.active?.id, "feed");
    assert.equal(state.phase, "playing");
    assert.equal(state.queue.length, 1);
  }
  state = petAnimationReducer(state, { type: "ADVANCE" });
  state = petAnimationReducer(state, { type: "ADVANCE" });
  assert.equal(state.active?.id, "tap-19");
});

test("a reward queued after a tap plays before the deferred hello", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("clean") });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("tap", "tap") });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("gift", "important") });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("latest-tap", "tap") });
  assert.deepEqual(state.queue.map((item) => item.id), ["gift", "latest-tap"]);
});

test("care starts immediately during a tap response", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("tap", "tap") });
  state = petAnimationReducer(state, { type: "ADVANCE" });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("feed") });
  assert.equal(state.active?.id, "feed");
  assert.equal(state.phase, "starting");
  assert.equal(state.queue.length, 0);
});

test("an important reward also starts immediately during a tap response", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("tap", "tap") });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("gift", "important") });
  assert.equal(state.active?.id, "gift");
  assert.equal(state.phase, "starting");
});

test("a latest tap received while paused stays paused until foreground resume", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("tap", "tap") });
  state = petAnimationReducer(state, { type: "PAUSE" });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("latest-tap", "tap"), startPaused: true });
  assert.equal(state.phase, "paused");
  assert.equal(state.active?.id, "latest-tap");
  state = petAnimationReducer(state, { type: "RESUME" });
  assert.equal(state.phase, "starting");
});

test("queues important animations without replacing the current animation", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("play") });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("gift", "important") });
  assert.equal(state.active?.id, "play");
  assert.equal(state.queue[0]?.id, "gift");
  state = petAnimationReducer(state, { type: "ADVANCE" });
  state = petAnimationReducer(state, { type: "ADVANCE" });
  state = petAnimationReducer(state, { type: "ADVANCE" });
  assert.equal(state.phase, "starting");
  assert.equal(state.active?.id, "gift");
});

test("does not enqueue the same important event twice", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("play") });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("gift", "important") });
  const unchanged = petAnimationReducer(state, { type: "REQUEST", request: request("gift", "important") });
  assert.equal(unchanged, state);
  assert.equal(unchanged.queue.length, 1);
});

test("pauses and resumes the exact animation phase", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("play") });
  state = petAnimationReducer(state, { type: "ADVANCE" });
  state = petAnimationReducer(state, { type: "PAUSE" });
  assert.equal(state.phase, "paused");
  assert.equal(state.resumePhase, "playing");
  state = petAnimationReducer(state, { type: "RESUME" });
  assert.equal(state.phase, "playing");
});

test("starts requests received in the background in a paused state", () => {
  const state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("gift", "important"), startPaused: true });
  assert.equal(state.phase, "paused");
  assert.equal(state.resumePhase, "starting");
  assert.equal(state.active?.id, "gift");
});

test("updates the message for an active or queued animation", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("play") });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("gift", "important") });
  state = petAnimationReducer(state, { type: "UPDATE_MESSAGE", id: "play", message: "Play complete" });
  state = petAnimationReducer(state, { type: "UPDATE_MESSAGE", id: "gift", message: "Gift waiting" });
  assert.equal(state.active?.message, "Play complete");
  assert.equal(state.queue[0]?.message, "Gift waiting");
});

test("canceling a failed action advances to the next important animation", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("play") });
  state = petAnimationReducer(state, { type: "REQUEST", request: request("gift", "important") });
  state = petAnimationReducer(state, { type: "CANCEL_ACTIVE" });
  assert.equal(state.phase, "starting");
  assert.equal(state.active?.id, "gift");
  assert.equal(state.queue.length, 0);
});

test("an interactive vet visit holds playing until manually completed, then releases queued rewards", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: { ...request("vet"), state: "vet", manual: true } });
  state = petAnimationReducer(state, { type: "ADVANCE" });
  assert.equal(phaseDurationMs(state), null);
  state = petAnimationReducer(state, { type: "REQUEST", request: request("gift", "important") });
  assert.equal(state.active?.id, "vet");
  assert.equal(petAnimationReducer(state, { type: "FINISH_MANUAL", id: "old" }), state);
  state = petAnimationReducer(state, { type: "FINISH_MANUAL", id: "vet" });
  assert.equal(state.phase, "finishing");
  assert.equal(phaseDurationMs(state), 220);
  state = petAnimationReducer(state, { type: "ADVANCE" });
  assert.equal(state.active?.id, "gift");
});

test("manual completion while paused retains pause and resumes into finishing", () => {
  let state = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: { ...request("vet"), manual: true } });
  state = petAnimationReducer(state, { type: "ADVANCE" });
  state = petAnimationReducer(state, { type: "PAUSE" });
  state = petAnimationReducer(state, { type: "FINISH_MANUAL", id: "vet" });
  assert.equal(state.phase, "paused");
  assert.equal(state.resumePhase, "finishing");
  state = petAnimationReducer(state, { type: "RESUME" });
  assert.equal(state.phase, "finishing");
  const normal = petAnimationReducer(initialPetAnimationState, { type: "REQUEST", request: request("ordinary") });
  assert.equal(petAnimationReducer(normal, { type: "FINISH_MANUAL", id: "ordinary" }), normal);
});
