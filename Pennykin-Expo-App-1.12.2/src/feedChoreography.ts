import { FEED_REACH_MS, FEED_EAT_MS, FEED_GROOM_MS, FEED_PET_LICK_MS, FEED_VISUAL_MS, type CatCarePose } from "./careChoreography";

export const FEED_BOWL_HIDE_MS = 800;
export const FEED_RETURN_MS = FEED_VISUAL_MS;
export const FEED_FOOD_START_MS = 200;
export const FEED_FIRST_BLEND_MS = 350;
export const FEED_SPEECH_MS = FEED_FIRST_BLEND_MS + 100;
export const FEED_CROSSFADE_MS = 300;
export const FEED_POSE_CROSSFADE_MS = FEED_CROSSFADE_MS;
export const FEED_PICKUP_SCALE = 1.05;
// base, receive, eat, satisfied, lick. Every transition conserves opacity.
export const FEED_TRANSITIONS = [
  { at: FEED_FIRST_BLEND_MS, from: 0, to: 1, duration: FEED_CROSSFADE_MS },
  { at: FEED_BOWL_HIDE_MS, from: 1, to: 2, duration: FEED_POSE_CROSSFADE_MS },
  { at: 1150, from: 2, to: 3, duration: FEED_POSE_CROSSFADE_MS },
  { at: FEED_PET_LICK_MS, from: 3, to: 4, duration: FEED_POSE_CROSSFADE_MS },
  { at: FEED_VISUAL_MS - FEED_CROSSFADE_MS, from: 4, to: 0, duration: FEED_CROSSFADE_MS },
] as const;

// An underdamped spring step response: positive overshoot and decaying recoil.
function spring(seconds: number, stiffness: number, damping: number, mass: number): number {
  if (seconds <= 0) return 0;
  const decay = damping / (2 * mass);
  const frequency = Math.sqrt(stiffness / mass - decay * decay);
  return 1 - Math.exp(-decay * seconds) * (Math.cos(frequency * seconds) + decay / frequency * Math.sin(frequency * seconds));
}

function smooth(value: number): number { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); }

export function feedWeightsAt(ms: number): number[] {
  const weights = [1, 0, 0, 0, 0];
  for (const transition of FEED_TRANSITIONS) {
    if (ms < transition.at) break;
    const mix = smooth((ms - transition.at) / transition.duration);
    weights.fill(0); weights[transition.from] = 1 - mix; weights[transition.to] = mix;
    if (mix < 1) break;
  }
  return weights;
}

export function feedPickupScaleAt(ms: number): number {
  const local = ms - FEED_FIRST_BLEND_MS;
  if (local <= 0 || ms >= FEED_VISUAL_MS) return 1;
  // A short 5% lift, followed by a gently underdamped return to 1.0.
  const liftMs = 70;
  if (local <= liftMs) return 1 + (FEED_PICKUP_SCALE - 1) * smooth(local / liftMs);
  return 1 + (FEED_PICKUP_SCALE - 1) * (1 - spring((local - liftMs) / 1000, 280, 15, 0.65));
}

export function feedSpeechAt(ms: number) {
  const local = ms - FEED_SPEECH_MS;
  return { opacity: smooth(local / 120), scale: 0.9 + 0.1 * spring(Math.max(0, local) / 1000, 240, 13, 0.7) };
}

export function feedSnapshot(progress: number) {
  const ms = Math.max(0, progress) * FEED_VISUAL_MS;
  const complete = ms >= FEED_VISUAL_MS;
  const pose: CatCarePose = ms < FEED_REACH_MS || ms >= FEED_RETURN_MS ? null
    : ms < FEED_EAT_MS ? 0 : ms < FEED_GROOM_MS ? 1 : ms < FEED_PET_LICK_MS ? 2 : 4;
  return { pose, complete, expecting: ms < FEED_FIRST_BLEND_MS,
    blinking: ms >= 150 && ms < 260,
    // Independent bowl retires before the full-body eating pose appears.
    bowlVisible: ms < FEED_BOWL_HIDE_MS && !complete };
}

export function feedBodyAt(ms: number) {
  if (ms <= 0 || ms >= FEED_VISUAL_MS) return { x: 0, y: 0, sx: 1, sy: 1, rotation: 0 };
  // Slow downward compression, a short held beat, then a quick spring release.
  const squash = ms < FEED_REACH_MS ? smooth(ms / 380)
    : 1 - spring((ms - FEED_REACH_MS) / 1000, 320, 9, 0.65);
  const lean = ms < FEED_REACH_MS ? 0 : ms < FEED_EAT_MS
    ? spring((ms - FEED_REACH_MS) / 1000, 280, 11, 0.6)
    : 1 - smooth((ms - FEED_EAT_MS) / 140);
  const chew = ms >= FEED_EAT_MS && ms < FEED_GROOM_MS
    ? Math.pow(Math.sin(Math.PI * Math.min(1, ((ms - FEED_EAT_MS) % 120) / 105)), 2) : 0;
  const groomTime = Math.max(0, ms - FEED_PET_LICK_MS) / 1000;
  const groom = ms >= FEED_PET_LICK_MS ? Math.exp(-6 * groomTime) * Math.sin(24 * groomTime) : 0;
  // Close to the return boundary, settle each transform continuously to idle.
  const settle = 1 - smooth((ms - 1760) / (FEED_VISUAL_MS - 1760));
  return { x: 0.025 * lean * settle,
    y: (0.028 * squash - 0.022 * lean + 0.018 * chew + 0.003 * groom) * settle,
    sx: 1 + (0.085 * squash - 0.012 * chew) * settle,
    sy: 1 + (-0.14 * squash - 0.02 * chew) * settle,
    rotation: (2.5 * lean + 2.8 * groom) * settle };
}

export function feedBowlAt(ms: number) {
  const local = Math.max(0, ms - FEED_FOOD_START_MS);
  const arrival = spring(local / 1000, 240, 9, 0.6);
  const travel = ms < 600 ? 0 : spring((ms - 600) / 1000, 280, 10, 0.6);
  const opacity = local <= 0 ? 0 : local < 100 ? smooth(local / 100)
    : ms < 720 ? 1 : ms < FEED_BOWL_HIDE_MS ? 1 - smooth((ms - 720) / 80) : 0;
  return { x: -0.48 * travel, y: 0.08 * (1 - arrival) - 0.08 * (1 - travel),
    scale: 0.55 + 0.45 * arrival, rotation: -8 + 8 * travel, opacity };
}

// A linear clock samples nonlinear spring motion; visible motion is never linear.
const times = Array.from({ length: Math.ceil(FEED_VISUAL_MS / 10) + 1 }, (_, i) => Math.min(i * 10, FEED_VISUAL_MS));
export const FEED_MOTION_INPUT = times.map((ms) => ms / FEED_VISUAL_MS);
export const FEED_BODY_PATH = times.map(feedBodyAt);
export const FEED_BOWL_PATH = times.map(feedBowlAt);
export const FEED_WEIGHTS = times.map(feedWeightsAt);
export const FEED_SPEECH_PATH = times.map(feedSpeechAt);
export const FEED_PICKUP_SCALE_PATH = times.map(feedPickupScaleAt);
