import assert from "node:assert/strict";
import test from "node:test";
import { initialPetAnimationState, petAnimationReducer as reduce, phaseDurationMs, restStageFor, type PetAnimationRequest } from "../src/petAnimationMachine";
import { REST_DURATION_MS, REST_ENTER_MS, REST_EXIT_MS, REST_LOOP_MS, restControls, restTransitionLocked } from "../src/restChoreography";
import { createCareMutationQueue } from "../src/careMutationQueue";

const rest: PetAnimationRequest = { id: "nap", state: "sleeping", message: "sleepy", priority: "interaction", durationMs: REST_DURATION_MS, rest: true };
const care = (id: string): PetAnimationRequest => ({ id, state: id === "feed" ? "eating" : id === "vet" ? "vet" : "playing", priority: "interaction", durationMs: 2400, message: id });
const enter = () => reduce(initialPetAnimationState, { type: "REQUEST", request: rest });
const loop = () => reduce(enter(), { type: "ADVANCE" });
const tap = (s: ReturnType<typeof loop>, at: number, id = "nap") => reduce(s, { type: "REST_TAP", id, at });

test("Rest runs yawn, timed sleep, stretch, then fully clears back to idle", () => {
  let s = enter();
  assert.equal(restStageFor(s), "Rest_Enter"); assert.equal(phaseDurationMs(s), REST_ENTER_MS);
  assert.equal(restTransitionLocked(restStageFor(s)), true);
  s = reduce(s, { type: "ADVANCE" });
  assert.equal(restStageFor(s), "Rest_Loop"); assert.equal(phaseDurationMs(s), REST_LOOP_MS);
  assert.equal(restTransitionLocked(restStageFor(s)), false);
  s = reduce(s, { type: "ADVANCE" });
  assert.equal(restStageFor(s), "Rest_Exit"); assert.equal(phaseDurationMs(s), REST_EXIT_MS);
  assert.equal(s.restWakeReason, "timeout");
  s = reduce(s, { type: "ADVANCE" });
  assert.deepEqual(s, initialPetAnimationState);
});

test("the first sleeping touch waits; a lone touch gently reacts without waking", () => {
  let s = tap(loop(), 1000);
  assert.equal(s.phase, "playing"); assert.equal(s.restFeedback, 0);
  s = reduce(s, { type: "REST_SINGLE_TIMEOUT", id: "nap", at: 1000 });
  assert.equal(s.phase, "playing"); assert.equal(s.restTapAt, null); assert.equal(s.restFeedback, 1);
  assert.equal(s.queue.length, 0);
});

test("a second touch at exactly 300ms wakes once without a single-tap bounce", () => {
  let s = tap(tap(loop(), 1000), 1300);
  assert.equal(restStageFor(s), "Rest_Exit"); assert.equal(s.restWakeReason, "doubleTap");
  assert.equal(s.restFeedback, 0); assert.equal(s.restTapAt, null);
  const wake = s;
  for (let i = 0; i < 100; i++) s = tap(s, 1301 + i);
  assert.equal(s, wake);
  assert.equal(reduce(s, { type: "REST_SINGLE_TIMEOUT", id: "nap", at: 1000 }), s);
});

test("301ms touches are separate singles even when the JS timeout runs late", () => {
  let s = tap(tap(loop(), 1000), 1301);
  assert.equal(s.phase, "playing"); assert.equal(s.restFeedback, 1); assert.equal(s.restTapAt, 1301);
  assert.equal(reduce(s, { type: "REST_SINGLE_TIMEOUT", id: "nap", at: 1000 }), s);
  s = reduce(s, { type: "REST_SINGLE_TIMEOUT", id: "nap", at: 1301 });
  assert.equal(s.restFeedback, 2); assert.equal(s.phase, "playing");
});

test("taps, wake requests and care presses cannot interrupt entering or exiting", () => {
  for (const s of [enter(), reduce(loop(), { type: "WAKE_REST", id: "nap", reason: "doubleTap" })]) {
    assert.equal(tap(s, 1000), s);
    assert.equal(reduce(s, { type: "WAKE_REST", id: "nap", reason: "doubleTap" }), s);
    assert.equal(reduce(s, { type: "REQUEST", request: care("feed") }), s);
    assert.equal(restTransitionLocked(restStageFor(s)), true);
  }
});

test("only explicit Rest_Loop accepts the gesture, never night or inactive sleep", () => {
  assert.equal(tap(initialPetAnimationState, 1000), initialPetAnimationState);
  let s = reduce(initialPetAnimationState, { type: "REQUEST", request: { ...rest, rest: false } });
  s = reduce(s, { type: "ADVANCE" });
  assert.equal(tap(s, 1000), s); assert.equal(restStageFor(s), null);
  const actualLoop = loop(); assert.equal(tap(actualLoop, 1000, "old-nap"), actualLoop);
});

test("Feed, Play, Clean, Vet and special treat wait for the full wake-up", () => {
  for (const action of ["feed", "play", "clean", "vet", "special-treat"]) {
    let s = reduce(loop(), { type: "REQUEST", request: care(action) });
    assert.equal(s.active?.id, "nap"); assert.equal(restStageFor(s), "Rest_Exit");
    assert.equal(s.restWakeReason, "action"); assert.equal(phaseDurationMs(s), 1000);
    assert.deepEqual(s.queue.map(r => r.id), [action]);
    // Fast second presses cannot replace the user's first queued intention.
    assert.equal(reduce(s, { type: "REQUEST", request: care("replacement") }), s);
    s = reduce(s, { type: "ADVANCE" });
    assert.equal(s.active?.id, action); assert.equal(s.phase, "starting");
    assert.equal(restStageFor(s), null); assert.equal(s.restTapAt, null);
    assert.equal(s.restFeedback, 0); assert.equal(s.restWakeReason, null);
  }
});

test("Rest cannot queue itself or accumulate hello animations", () => {
  let s = loop();
  assert.equal(reduce(s, { type: "REQUEST", request: { ...rest, id: "second-nap" } }), s);
  for (let i = 0; i < 50; i++) s = reduce(s, { type: "REQUEST", request: { ...care(`hello-${i}`), priority: "tap" } });
  assert.equal(s.active?.id, "nap"); assert.equal(s.queue.length, 0); assert.equal(s.phase, "playing");
});

test("backgrounding preserves each Rest stage but invalidates the tap window", () => {
  for (const original of [enter(), tap(loop(), 1000), tap(tap(loop(), 1000), 1200)]) {
    let s = reduce(original, { type: "PAUSE" });
    assert.equal(s.phase, "paused"); assert.equal(phaseDurationMs(s), null); assert.equal(s.restTapAt, null);
    assert.equal(restStageFor(s), restStageFor(original));
    assert.equal(tap(s, 1100), s); assert.equal(reduce(s, { type: "ADVANCE" }), s);
    s = reduce(s, { type: "RESUME" }); assert.equal(s.phase, original.phase);
    if (s.phase === "playing") assert.equal(tap(s, 1150).phase, "playing");
  }
});

test("a queued action survives a pause in the wake-up phase", () => {
  let s = reduce(loop(), { type: "REQUEST", request: care("feed") });
  s = reduce(s, { type: "PAUSE" });
  assert.equal(reduce(s, { type: "ADVANCE" }), s);
  s = reduce(s, { type: "RESUME" });
  assert.equal(restStageFor(s), "Rest_Exit");
  s = reduce(s, { type: "ADVANCE" }); assert.equal(s.active?.id, "feed");
});

test("cancelled naps and stale database failures cannot cancel a later action", () => {
  let s = reduce(loop(), { type: "REQUEST", request: care("feed") });
  s = reduce(s, { type: "ADVANCE" });
  const next = reduce(s, { type: "CANCEL_ID", id: "nap" });
  assert.equal(next.active?.id, "feed"); assert.equal(next.phase, "starting");
  assert.deepEqual(reduce(next, { type: "CLEAR" }), initialPetAnimationState);
});

test("a rest-loop care interruption precedes queued rewards without losing them", () => {
  let s = reduce(loop(), { type: "REQUEST", request: { ...care("gift"), priority: "important" } });
  s = reduce(s, { type: "REQUEST", request: care("feed") });
  assert.deepEqual(s.queue.map(r => r.id), ["feed", "gift"]);
  s = reduce(s, { type: "ADVANCE" }); assert.equal(s.active?.id, "feed");
  for (let i = 0; i < 3; i++) s = reduce(s, { type: "ADVANCE" });
  assert.equal(s.active?.id, "gift");
});

test("animation control outputs activate yawn and wake only on their own stages", () => {
  assert.deepEqual(restControls("Rest_Enter"), { isResting: true, triggerYawn: true, triggerWakeUp: false });
  assert.deepEqual(restControls("Rest_Loop"), { isResting: true, triggerYawn: false, triggerWakeUp: false });
  assert.deepEqual(restControls("Rest_Exit"), { isResting: false, triggerYawn: false, triggerWakeUp: true });
  assert.deepEqual(restControls(null), { isResting: false, triggerYawn: false, triggerWakeUp: false });
});

test("slow Rest and chained Feed writes do not read and overwrite the same stats", async () => {
  const queue = createCareMutationQueue();
  let energy = 20;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const events: string[] = [];
  const restWrite = queue.run(async () => { events.push("rest-start"); const before = energy; await gate; energy = before + 22; events.push("rest-end"); });
  const feedWrite = queue.run(async () => { events.push("feed"); energy -= 1; });
  await Promise.resolve(); assert.deepEqual(events, ["rest-start"]);
  release(); await Promise.all([restWrite, feedWrite]);
  assert.equal(energy, 41); assert.deepEqual(events, ["rest-start", "rest-end", "feed"]);
});

test("failed care writes release the queue so a following action can still run", async () => {
  const queue = createCareMutationQueue();
  const failed = queue.run(async () => { throw new Error("database unavailable"); });
  const next = queue.run(async () => "next action applied");
  await assert.rejects(failed, /database unavailable/);
  assert.equal(await next, "next action applied");
});
