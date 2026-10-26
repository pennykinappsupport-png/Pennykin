import type { AnimationObject } from "lottie-react-native";
import type { PetType } from "./types";

// Metro parses local JSON once. The selected native view is also mounted at
// home before a care request, so the composition is loaded before playback.
export const BATH_SOURCES: Record<PetType, AnimationObject> = {
  dog: require("../assets/animation/bath-original/dog.json"),
  cat: require("../assets/animation/bath-original/cat.json"),
  rabbit: require("../assets/animation/bath-original/rabbit.json"),
};
export function preloadBathComposition(type: PetType) {
  const source = BATH_SOURCES[type];
  if(source.w !== 1024 || source.h !== 1024 || source.fr !== 15 || source.op !== 75) {
    throw new Error("Bath composition must be 1024px, 75 frames at 15fps.");
  }
  return source;
}
