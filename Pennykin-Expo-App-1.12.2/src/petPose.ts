import type { PetVisualState } from "./types";

export type PetPose = "base" | "blink" | "rest" | "eat" | "play";
export type PetPoseReadiness = Record<Exclude<PetPose, "base">, boolean>;

export function canPetBlink(state: PetVisualState): boolean {
  return state !== "eating" && state !== "bathing" && state !== "playing" && state !== "sleeping" && state !== "vet";
}

export type PetFrame = { body: "base" | "rest" | "play"; face: "blink" | "eat" | null };

// Eyes and mouth change independently of the body. Never replace the entire
// pet image for a blink/chew, and never carry facial frames into another action.
export function selectPetFrame(
  state: PetVisualState,
  ready: PetPoseReadiness,
  frames: { blinkClosed: boolean; chewing: boolean; toyCaught: boolean },
): PetFrame {
  if (state === "sleeping") return { body: ready.rest ? "rest" : "base", face: null };
  if (state === "eating") return { body: "base", face: ready.eat && frames.chewing ? "eat" : null };
  // Action poses are empty-handed; the single runtime toy owns visibility.
  // Never expose the legacy grab bitmap containing a second baked-in star.
  if (state === "playing") return { body: "base", face: null };
  return { body: "base", face: canPetBlink(state) && ready.blink && frames.blinkClosed ? "blink" : null };
}
