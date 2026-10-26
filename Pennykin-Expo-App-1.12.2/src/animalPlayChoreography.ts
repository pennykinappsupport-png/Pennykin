import { parabolaY, type PlayPose } from "./playChoreography";

// Dog/rabbit share one deterministic native clock. Values are proportions of
// the avatar square; toy coordinates describe its CENTER, not its top-left.
export const ANIMAL_PLAY_VISUAL_MS = 4800;
export const ANIMAL_PLAY_DURATION_MS = 5100;
export const ANIMAL_PLAY_CATCH_MS = 1670;
export const ANIMAL_PLAY_LAND_MS = 1880;
export const ANIMAL_PLAY_RELEASE_MS = 2420;
export const ANIMAL_PLAY_ROLL_MS = 2700;
export const ANIMAL_PLAY_TOY_END_MS = 3220;
export const ANIMAL_PLAY_JOY_MS = 2920;
export const ANIMAL_PLAY_FADE_MS = 260;
export const ANIMAL_PLAY_MESSAGES = [
  "A bouncing ball! Let's chase it!",
  "Ready… here I come!",
  "Caught it! A big happy hug!",
  "Yay! Let's play again soon!",
] as const;
const clamp = (p: number) => Math.max(0, Math.min(1, p));
const smooth = (p: number) => { const u = clamp(p); return u * u * (3 - 2 * u); };
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

export function animalPlayBody(ms: number) {
  const t = Math.max(0, ms);
  let x = 0, y = 0, rotation = 0, sx = 1, sy = 1;
  if (t < 500) {
    const p = t / 500, prep = Math.sin(p * Math.PI);
    sx += .055 * prep; sy -= .095 * prep;
    x = .012 * Math.sin(p * Math.PI * 4) * prep;
    rotation = 2.5 * Math.sin(p * Math.PI * 4) * prep;
  } else if (t < 1160) {
    const p = (t - 500) / 660, stride = Math.sin(p * Math.PI * 2);
    x = .18 * smooth(p); y = -.035 * stride ** 2;
    rotation = 3 * Math.sin(p * Math.PI * 4) * Math.sin(p * Math.PI);
    sx -= .025 * stride ** 2; sy += .04 * stride ** 2;
  } else if (t < 1440) {
    const p = (t - 1160) / 280;
    x = .18 + .01 * Math.sin(p * Math.PI * 4) * Math.sin(p * Math.PI);
    sx += .08 * Math.sin(p * Math.PI); sy -= .14 * Math.sin(p * Math.PI);
    rotation = 3 * Math.sin(p * Math.PI * 4) * Math.sin(p * Math.PI);
  } else if (t < ANIMAL_PLAY_LAND_MS) {
    const p = (t - 1440) / (ANIMAL_PLAY_LAND_MS - 1440);
    x = mix(.18, .24, smooth(p)); y = parabolaY(0, 0, .17, p);
    sx -= .07 * Math.sin(p * Math.PI); sy += .14 * Math.sin(p * Math.PI);
    rotation = -7 * Math.sin(p * Math.PI);
  } else if (t < 2200) {
    const p = (t - ANIMAL_PLAY_LAND_MS) / (2200 - ANIMAL_PLAY_LAND_MS);
    const squash = Math.sin(p * Math.PI * 3) * Math.exp(-4 * p);
    x = .24; sx += .17 * squash; sy -= .22 * squash;
  } else if (t < 2920) {
    const p = (t - 2200) / 720;
    x = .24; rotation = 7 * Math.sin(p * Math.PI * 2);
    y = -.02 * Math.sin(p * Math.PI) ** 2;
  } else if (t < 3820) {
    const p = (t - 2920) / 900;
    x = .24; y = -.055 * Math.sin(p * Math.PI * 2) ** 2;
    rotation = 3.5 * Math.sin(p * Math.PI * 4) * Math.sin(p * Math.PI);
    sy += .025 * Math.sin(p * Math.PI * 2) ** 2;
  } else if (t < ANIMAL_PLAY_VISUAL_MS) {
    x = .24 * (1 - smooth((t - 3820) / (ANIMAL_PLAY_VISUAL_MS - 3820)));
  }
  return { x, y, rotation, sx, sy };
}

export function animalHeldPoint(ms: number, lowering = 0, type: "dog" | "rabbit" = "dog") {
  const b = animalPlayBody(ms), angle = b.rotation * Math.PI / 180;
  const hand = type === "dog" ? { x: .665, y: .602 } : { x: .602, y: .65 };
  const x = (hand.x - .5) * b.sx, y = (mix(hand.y, .875, lowering) - .97) * b.sy;
  return { x: .5 + b.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: .97 + b.y + x * Math.sin(angle) + y * Math.cos(angle) };
}
export function animalPlayToy(ms: number, type: "dog" | "rabbit" = "dog") {
  const t = Math.max(0, ms);
  // Air drag slows horizontal travel; gravity produces an actual curved arc.
  if (t < 600) {
    const p = t / 600;
    return { x: mix(-1.45, .65, (1 - Math.exp(-1.2 * p)) / (1 - Math.exp(-1.2))),
      y: parabolaY(.90, .875, .36, p) };
  }
  // Two distinct, diminishing floor bounces. No fade or teleport at contact.
  if (t < 920) { const p = (t - 600) / 320; return { x: mix(.65, .81, p), y: parabolaY(.875, .875, .15, p) }; }
  if (t < 1160) { const p = (t - 920) / 240; return { x: mix(.81, .90, p), y: parabolaY(.875, .875, .065, p) }; }
  if (t < 1440) return { x: .90, y: .875 };
  if (t < ANIMAL_PLAY_CATCH_MS) {
    const p = (t - 1440) / (ANIMAL_PLAY_CATCH_MS - 1440), target = animalHeldPoint(ANIMAL_PLAY_CATCH_MS, 0, type);
    return { x: mix(.90, target.x, smooth(p)), y: parabolaY(.875, target.y, .06, p) };
  }
  if (t < ANIMAL_PLAY_ROLL_MS) return animalHeldPoint(t, smooth((t - ANIMAL_PLAY_RELEASE_MS) / (ANIMAL_PLAY_ROLL_MS - ANIMAL_PLAY_RELEASE_MS)), type);
  const start = animalHeldPoint(ANIMAL_PLAY_ROLL_MS, 1, type), p = clamp((t - ANIMAL_PLAY_ROLL_MS) / (ANIMAL_PLAY_TOY_END_MS - ANIMAL_PLAY_ROLL_MS));
  return { x: mix(start.x, 2.1, (1 - Math.exp(-1.5 * p)) / (1 - Math.exp(-1.5))), y: mix(start.y, .875, smooth(p)) };
}
export function animalPlayToyOpacity(ms: number) {
  if (ms <= 0 || ms >= ANIMAL_PLAY_TOY_END_MS) return 0;
  return smooth(ms / 60) * (1 - smooth((ms - 3100) / 120));
}
export function animalPlayToyRotation(ms: number) {
  if (ms < ANIMAL_PLAY_CATCH_MS) return mix(-270, 0, clamp(ms / ANIMAL_PLAY_CATCH_MS));
  if (ms < ANIMAL_PLAY_ROLL_MS) return animalPlayBody(ms).rotation;
  return mix(animalPlayBody(ANIMAL_PLAY_ROLL_MS).rotation, 460, clamp((ms - ANIMAL_PLAY_ROLL_MS) / 520));
}
export function animalPlayToyScale(ms: number) {
  for (const contact of [600, 920, 1160]) {
    if (ms >= contact && ms < contact + 90) return 1 - .16 * Math.sin((ms - contact) / 90 * Math.PI);
  }
  return 1;
}

// Layer zero is the original idle bitmap; layers 1..6 are empty-handed poses.
// Always blend resident layers for 260ms, including entry and retirement.
export const ANIMAL_PLAY_POSE_EVENTS = [
  [160, 1], [500, 2], [800, 3], [1100, 1], [1400, 4],
  [1670, 5], [2840, 6], [4300, 0],
] as const;
export function animalPlayWeights(ms: number) {
  let weights: number[] = [1, 0, 0, 0, 0, 0, 0];
  for (const [at, layer] of ANIMAL_PLAY_POSE_EVENTS) {
    if (ms < at) break;
    const blend = smooth((ms - at) / ANIMAL_PLAY_FADE_MS);
    weights = weights.map((w, i) => w * (1 - blend) + (i === layer ? blend : 0));
    if (blend < 1) break;
  }
  return weights;
}
export function animalPlayMessage(ms: number) {
  return ANIMAL_PLAY_MESSAGES[ms < 1360 ? 0 : ms < ANIMAL_PLAY_CATCH_MS + 200 ? 1 : ms < ANIMAL_PLAY_JOY_MS + 200 ? 2 : 3];
}
export function animalPlaySnapshot(progress: number) {
  const ms = clamp(progress) * ANIMAL_PLAY_VISUAL_MS;
  let pose: PlayPose = null;
  for (const [at, layer] of ANIMAL_PLAY_POSE_EVENTS) if (ms >= at) pose = layer === 0 ? null : (layer - 1) as PlayPose;
  return { pose, caught: ms >= ANIMAL_PLAY_CATCH_MS && ms < ANIMAL_PLAY_RELEASE_MS,
    complete: ms >= ANIMAL_PLAY_VISUAL_MS, message: animalPlayMessage(ms) };
}
export const ANIMAL_PLAY_TIMES = [...new Set([...Array.from({ length: ANIMAL_PLAY_VISUAL_MS / 10 + 1 }, (_, i) => i * 10),
  ANIMAL_PLAY_CATCH_MS, ANIMAL_PLAY_LAND_MS, ANIMAL_PLAY_RELEASE_MS, ANIMAL_PLAY_ROLL_MS, ANIMAL_PLAY_TOY_END_MS])].sort((a, b) => a - b);
export const ANIMAL_PLAY_INPUT = ANIMAL_PLAY_TIMES.map(t => t / ANIMAL_PLAY_VISUAL_MS);
export const ANIMAL_PLAY_BODY_PATH = ANIMAL_PLAY_TIMES.map(animalPlayBody);
export const ANIMAL_PLAY_TOY_PATH = ANIMAL_PLAY_TIMES.map(t => animalPlayToy(t));

export const RABBIT_PLAY_TOY_PATH = ANIMAL_PLAY_TIMES.map(t => animalPlayToy(t, "rabbit"));
export const ANIMAL_PLAY_WEIGHT_PATH = ANIMAL_PLAY_TIMES.map(animalPlayWeights);
