import type { PetVisualState } from "./types";

export const FEED_DURATION_MS = 2300;
export const FEED_VISUAL_MS = 2200;
export const FEED_PREP_SQUASH_MS = 340;
export const FEED_REACH_MS = 480;
export const FEED_TAKE_MS = 600;
export const FEED_EAT_MS = 820;
export const FEED_GROOM_MS = 1320;
export const FEED_REACH_AT = FEED_REACH_MS / FEED_VISUAL_MS;
export const FEED_EAT_AT = FEED_EAT_MS / FEED_VISUAL_MS;
export const FEED_GROOM_AT = FEED_GROOM_MS / FEED_VISUAL_MS;
// Dogs and rabbits pause on their satisfied, empty-bowl pose before licking.
export const FEED_PET_LICK_MS = 1450;
export const FEED_PET_LICK_AT = FEED_PET_LICK_MS / FEED_VISUAL_MS;
// Underdamped physical springs produce a small overshoot, then settle.
export const FEED_BODY_SPRING = { stiffness: 360, damping: 11, mass: 0.65 };
export const FEED_BOWL_SPRING = { stiffness: 260, damping: 10, mass: 0.6 };
export const FEED_GROOM_SPRING = { stiffness: 210, damping: 10, mass: 0.48 };
export const FEED_CHEW_MS = { down: 40, hold: 10, up: 55, rest: 15 };
export const BATH_WIPE_START = 0.42;
export const BATH_WIPE_END = 0.84;

export function feedStage(progress: number): "expect" | "receive" | "eat" | "groom" {
  return progress < FEED_REACH_AT ? "expect" : progress < FEED_EAT_AT ? "receive" : progress < FEED_GROOM_AT ? "eat" : "groom";
}

export function isWipingFace(progress: number): boolean {
  return progress >= BATH_WIPE_START && progress < BATH_WIPE_END;
}

export function canIdleFidget(state: PetVisualState, hasAction: boolean): boolean {
  return !hasAction && (state === "calm" || state === "curious" || state === "worried");
}

export type CatCarePose = 0 | 1 | 2 | 3 | 4 | null;

export function petCareFrame(state: PetVisualState, ready: boolean, frames: { reaching: boolean; eating: boolean; satisfied: boolean; licking: boolean; wipeStarted: boolean; wipeEnded: boolean }): CatCarePose {
  if (!ready) return null;
  if (state === "eating") return frames.licking ? 4 : frames.satisfied ? 2 : frames.eating ? 1 : frames.reaching ? 0 : null;
  if (state === "bathing" && frames.wipeStarted && !frames.wipeEnded) return 3;
  return null;
}

export function feedBowlIsEmbedded(frame: CatCarePose): boolean {
  // Receive has no bowl yet; eat/satisfied contain one; licking removes it.
  return frame === 1 || frame === 2 || frame === 4;
}

export function catCareFrame(state: PetVisualState, ready: boolean, frames: { reaching: boolean; eating: boolean; grooming: boolean; wipeStarted: boolean; wipeEnded: boolean }, lickReady = false): CatCarePose {
  if (!ready) return null;
  // Keep the standing body for the expectation/squash stage. Missing lick art
  // falls back to the satisfied atlas pose without disappearing or using bath art.
  if (state === "eating") return frames.grooming ? (lickReady ? 4 : 2) : frames.eating ? 1 : frames.reaching ? 0 : null;
  if (state === "bathing" && frames.wipeStarted && !frames.wipeEnded) return 3;
  return null;
}
