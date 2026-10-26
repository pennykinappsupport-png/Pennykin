// One clock owns the complete story, including the prop's retirement. No pose
// in the new atlas contains a toy: there is exactly one temporary star View.
export const PLAY_VISUAL_MS = 2400;
export const PLAY_DURATION_MS = 2600;
export const PLAY_CROUCH_MS = 120;
export const PLAY_JUMP_MS = 300;
export const PLAY_CATCH_MS = 540;
export const PLAY_LAND_MS = 700;
export const PLAY_JOY_MS = 900;
export const PLAY_RELEASE_MS = 1580;
export const PLAY_ROLL_MS = 1760;
export const PLAY_TOY_END_MS = 2140;
export const PLAY_IDLE_MS = 2200;
export const PLAY_SPEECH_DELAY_MS = 200;
export type PlayPose = 0 | 1 | 2 | 3 | 4 | 5 | null;
export const PLAY_MESSAGES = [
  "Wow! Is that new toy for me?",
  "Caught it! Behold my mighty kitty paws~",
  "That was so much fun—I'm buzzing with excitement!",
  "Phew… a little tired, but I still want to play!",
] as const;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (p: number) => p * p * (3 - 2 * p);
export function parabolaY(start: number, end: number, height: number, p: number) {
  const u = clamp(p);
  return mix(start, end, u) - 4 * height * u * (1 - u);
}
export function playFrame(ms: number, atlasReady = true): PlayPose {
  if (!atlasReady || ms < PLAY_CROUCH_MS || ms >= PLAY_IDLE_MS) return null;
  if (ms < PLAY_JUMP_MS) return 0;
  if (ms < PLAY_CATCH_MS) return 1;
  if (ms < PLAY_JOY_MS) return 2;
  if (ms < PLAY_RELEASE_MS) return 3;
  if (ms < 1880) return 4;
  return 5;
}
export function playMessage(ms: number) {
  // Words follow the visible action by 200ms, rather than changing with a pose.
  if (ms < PLAY_CATCH_MS + PLAY_SPEECH_DELAY_MS) return PLAY_MESSAGES[0];
  if (ms < PLAY_JOY_MS + PLAY_SPEECH_DELAY_MS) return PLAY_MESSAGES[1];
  if (ms < PLAY_RELEASE_MS + PLAY_SPEECH_DELAY_MS) return PLAY_MESSAGES[2];
  return PLAY_MESSAGES[3];
}
export function playBody(ms: number) {
  const t = Math.max(0, ms);
  let x = 0, y = 0, rotation = 0, sx = 1, sy = 1;
  if (t < PLAY_JUMP_MS) {
    const p = t / PLAY_JUMP_MS;
    const prep = Math.sin(p * Math.PI);
    sx = 1 + 0.035 * prep; sy = 1 - 0.055 * prep;
    x = Math.sin(p * Math.PI * 2) * prep * 0.008;
    rotation = Math.sin(p * Math.PI * 2) * prep * 1.6;
  } else if (t < PLAY_LAND_MS) {
    const p = (t - PLAY_JUMP_MS) / (PLAY_LAND_MS - PLAY_JUMP_MS);
    x = 0.10 * smooth(p); y = parabolaY(0, 0, 0.14, p);
    const stretch = Math.sin(p * Math.PI);
    sx = 1 - 0.05 * stretch; sy = 1 + 0.10 * stretch;
    rotation = -4 * stretch;
  } else if (t < PLAY_JOY_MS) {
    const p = (t - PLAY_LAND_MS) / (PLAY_JOY_MS - PLAY_LAND_MS);
    // Continuous contact: smoothly enter the compression over the first 25ms,
    // then overshoot and settle. The landing pose changes during compression.
    const compression = Math.sin(p * Math.PI * 3) * Math.exp(-4 * p);
    x = 0.10; sx = 1 + 0.14 * compression; sy = 1 - 0.18 * compression;
  } else if (t < PLAY_RELEASE_MS) {
    const p = (t - PLAY_JOY_MS) / (PLAY_RELEASE_MS - PLAY_JOY_MS);
    x = 0.10; rotation = Math.sin(p * Math.PI * 2) * 3.5;
    y = -0.012 * Math.sin(p * Math.PI * 2) ** 2;
  } else if (t < PLAY_VISUAL_MS) {
    const p = (t - PLAY_RELEASE_MS) / (PLAY_VISUAL_MS - PLAY_RELEASE_MS);
    x = 0.10 * (1 - smooth(p));
    rotation = Math.sin(p * Math.PI * 2) * Math.exp(-4 * p) * 2;
  }
  return { x, y, rotation, sx, sy };
}

// Transform a local prop point with the same grounded body rig as PetAvatar.
function heldPoint(ms: number, lowering = 0) {
  const b = playBody(ms), angle = b.rotation * Math.PI / 180;
  const x = (0.53 - 0.5) * b.sx;
  const y = (mix(0.61, 0.78, lowering) - 0.97) * b.sy;
  return { x: b.x + 0.5 + x * Math.cos(angle) - y * Math.sin(angle),
    y: b.y + 0.97 + x * Math.sin(angle) + y * Math.cos(angle) };
}
export function playToy(ms: number) {
  const t = Math.max(0, ms);
  if (t < PLAY_CATCH_MS) {
    const target = heldPoint(PLAY_CATCH_MS), p = t / PLAY_CATCH_MS;
    return { x: mix(-0.50, target.x, 1 - (1 - p) ** 1.25),
      y: parabolaY(0.82, target.y, 0.20, p) };
  }
  if (t < PLAY_ROLL_MS) {
    const lowering = smooth(clamp((t - PLAY_RELEASE_MS) / (PLAY_ROLL_MS - PLAY_RELEASE_MS)));
    return heldPoint(t, lowering);
  }
  const start = heldPoint(PLAY_ROLL_MS, 1), p = clamp((t - PLAY_ROLL_MS) / (PLAY_TOY_END_MS - PLAY_ROLL_MS));
  return { x: mix(start.x, 1.55, smooth(p)), y: parabolaY(start.y, 0.94, 0.035, p) };
}
export function playToyOpacity(ms: number) {
  if (ms <= 0 || ms >= PLAY_TOY_END_MS) return 0;
  if (ms < 40) return ms / 40;
  if (ms > 1840) return 1 - smooth((ms - 1840) / (PLAY_TOY_END_MS - 1840));
  return 1;
}
export function playToyScale(ms: number) {
  if (ms < PLAY_CATCH_MS) return mix(0.85, 1, smooth(ms / PLAY_CATCH_MS));
  if (ms < PLAY_ROLL_MS) return 1;
  return mix(1, 0.75, smooth(clamp((ms - PLAY_ROLL_MS) / 240)));
}
export function playToyRotation(ms: number) {
  if (ms < PLAY_CATCH_MS) return mix(-100, 0, smooth(ms / PLAY_CATCH_MS));
  if (ms < PLAY_ROLL_MS) return playBody(ms).rotation;
  return mix(playBody(PLAY_ROLL_MS).rotation, 160, smooth(clamp((ms - PLAY_ROLL_MS) / (PLAY_TOY_END_MS - PLAY_ROLL_MS))));
}
export function playSpeechOpacity(ms: number) {
  return smooth(clamp((ms - PLAY_SPEECH_DELAY_MS) / 160));
}
export function playSnapshot(progress: number) {
  const ms = clamp(progress) * PLAY_VISUAL_MS;
  return { pose: playFrame(ms), caught: ms >= PLAY_CATCH_MS && ms < PLAY_RELEASE_MS,
    complete: ms >= PLAY_VISUAL_MS, message: playMessage(ms) };
}
export const PLAY_TIMES = [...new Set([
  ...Array.from({ length: PLAY_VISUAL_MS / 10 + 1 }, (_, i) => i * 10),
  PLAY_CROUCH_MS, PLAY_JUMP_MS, PLAY_CATCH_MS, PLAY_LAND_MS, PLAY_JOY_MS,
  PLAY_RELEASE_MS, PLAY_ROLL_MS, PLAY_TOY_END_MS, PLAY_IDLE_MS,
])].sort((a, b) => a - b);
export const PLAY_INPUT = PLAY_TIMES.map((ms) => ms / PLAY_VISUAL_MS);
export const PLAY_BODY_PATH = PLAY_TIMES.map(playBody);
export const PLAY_TOY_PATH = PLAY_TIMES.map(playToy);
export const PLAY_TOY_OPACITY = PLAY_TIMES.map(playToyOpacity);
export const PLAY_SPEECH_OPACITY = PLAY_TIMES.map(playSpeechOpacity);
