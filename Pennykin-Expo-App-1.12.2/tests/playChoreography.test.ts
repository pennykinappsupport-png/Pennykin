import assert from "node:assert/strict";
import test from "node:test";
import { parabolaY, playBody, playFrame, playMessage, playToy, playSnapshot, playToyOpacity, playSpeechOpacity, PLAY_BODY_PATH, PLAY_INPUT, PLAY_MESSAGES, PLAY_CATCH_MS, PLAY_CROUCH_MS, PLAY_DURATION_MS, PLAY_JOY_MS, PLAY_JUMP_MS, PLAY_LAND_MS, PLAY_RELEASE_MS, PLAY_ROLL_MS, PLAY_TOY_END_MS, PLAY_IDLE_MS, PLAY_TIMES, PLAY_TOY_PATH, PLAY_VISUAL_MS, PLAY_SPEECH_DELAY_MS } from "../src/playChoreography";

test("the compact story includes anticipation, flight, embrace, release and idle", () => {
  assert.ok(PLAY_VISUAL_MS >= 2000 && PLAY_VISUAL_MS <= 3000);
  assert.ok(PLAY_JUMP_MS <= 300 && PLAY_LAND_MS <= 700);
  assert.deepEqual([0, PLAY_CROUCH_MS, PLAY_JUMP_MS, PLAY_CATCH_MS, PLAY_JOY_MS, PLAY_RELEASE_MS, 1880, PLAY_IDLE_MS, PLAY_VISUAL_MS].map((ms) => playFrame(ms)), [null, 0, 1, 2, 3, 4, 5, null, null]);
  assert.ok(PLAY_DURATION_MS > PLAY_VISUAL_MS);
});
test("one star travels continuously from outside into the paws, then offscreen", () => {
  assert.ok(playToy(0).x < -0.25);
  assert.ok(playToy(270).y < playToy(0).y - 0.3);
  assert.ok(playToy(PLAY_CATCH_MS).y < 0.5);
  for (const boundary of [PLAY_CATCH_MS, PLAY_RELEASE_MS, PLAY_ROLL_MS, PLAY_TOY_END_MS]) {
    const before = playToy(boundary - 0.01), after = playToy(boundary);
    assert.ok(Math.abs(before.x - after.x) < 0.001);
    assert.ok(Math.abs(before.y - after.y) < 0.001);
  }
  assert.ok(playToy(PLAY_TOY_END_MS).x > 1.3);
});
test("the prop stays hidden after retirement even with no artwork or a delayed owner finish", () => {
  assert.equal(playToyOpacity(0), 0);
  assert.equal(playToyOpacity(100), 1);
  assert.equal(playToyOpacity(PLAY_CATCH_MS), 1);
  assert.ok(playToyOpacity(2000) > 0 && playToyOpacity(2000) < 1);
  for (const ms of [PLAY_TOY_END_MS, PLAY_IDLE_MS, PLAY_VISUAL_MS, PLAY_DURATION_MS, 10000]) {
    assert.equal(playToyOpacity(ms), 0);
    assert.equal(playFrame(ms, false), null);
  }
});
test("completion returns empty hands and cannot resurrect the held-toy frame", () => {
  const caught = playSnapshot(PLAY_CATCH_MS / PLAY_VISUAL_MS);
  assert.equal(caught.caught, true);
  const retiring = playSnapshot(PLAY_RELEASE_MS / PLAY_VISUAL_MS);
  assert.equal(retiring.caught, false);
  const final = playSnapshot(1);
  assert.equal(final.pose, null); assert.equal(final.caught, false); assert.equal(final.complete, true);
  assert.deepEqual(playSnapshot(2), final);
  assert.equal(playSnapshot(0).pose, null);
  assert.equal(playSnapshot(0).complete, false);
});
test("contact motion is continuous, with stretch, compression and rebound before settling", () => {
  const prep = playBody(150);
  assert.ok(prep.sx > 1 && prep.sy < 1);
  const apex = playBody((PLAY_JUMP_MS + PLAY_LAND_MS) / 2);
  assert.ok(apex.y < -0.13 && apex.sy > 1.09 && apex.sx < 1);
  assert.ok(playBody(PLAY_LAND_MS + 30).sy < 0.92);
  assert.ok(playBody(PLAY_LAND_MS + 95).sy > 1);
  for (const boundary of [PLAY_JUMP_MS, PLAY_LAND_MS, PLAY_JOY_MS, PLAY_RELEASE_MS]) {
    const before = playBody(boundary - 0.01), after = playBody(boundary);
    for (const key of ['x','y','sx','sy','rotation'] as const) assert.ok(Math.abs(before[key] - after[key]) < 0.005, `${key} at ${boundary}`);
  }
  assert.deepEqual(playBody(PLAY_VISUAL_MS), { x: 0, y: 0, rotation: 0, sx: 1, sy: 1 });
});
test("bubble and words trail their corresponding action by 200ms", () => {
  assert.equal(PLAY_SPEECH_DELAY_MS, 200);
  assert.equal(playSpeechOpacity(199), 0);
  assert.equal(playSpeechOpacity(200), 0);
  assert.ok(playSpeechOpacity(280) > 0);
  assert.equal(playMessage(PLAY_CATCH_MS + 199), PLAY_MESSAGES[0]);
  assert.equal(playMessage(PLAY_CATCH_MS + 200), PLAY_MESSAGES[1]);
  assert.equal(playMessage(PLAY_JOY_MS + 200), PLAY_MESSAGES[2]);
  assert.equal(playMessage(PLAY_RELEASE_MS + 200), PLAY_MESSAGES[3]);
});
test("native paths include cleanup endpoints and remain bounded and strictly ordered", () => {
  assert.equal(PLAY_INPUT.length, PLAY_BODY_PATH.length);
  assert.equal(PLAY_INPUT.length, PLAY_TOY_PATH.length);
  assert.equal(PLAY_INPUT[0], 0); assert.equal(PLAY_INPUT.at(-1), 1);
  assert.ok(PLAY_TIMES.includes(PLAY_TOY_END_MS) && PLAY_TIMES.includes(PLAY_IDLE_MS));
  for (let i = 1; i < PLAY_INPUT.length; i++) assert.ok(PLAY_INPUT[i]! > PLAY_INPUT[i - 1]!);
  for (const p of PLAY_BODY_PATH) {
    assert.ok(Object.values(p).every(Number.isFinite));
    assert.ok(p.x >= -0.02 && p.x <= 0.11 && p.y >= -0.15 && p.sy > 0.85 && p.sy < 1.15);
  }
  assert.equal(parabolaY(2, 5, 3, 0), 2); assert.equal(parabolaY(2, 5, 3, 1), 5);
});
