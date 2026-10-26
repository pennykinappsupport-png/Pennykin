import type { ImageStyle } from "react-native";
import type { PetType } from "./types";

// Visible alpha bounds in the 600x640 source images:
// cat: 525x303, bottom 585; dog: 526x241, bottom 426.
// Match the cat's body height/width and floor baseline without changing the
// dog's width or affecting its standing/action artwork. ResizeMode contain
// scales these images by size/640 in the square avatar container.
export const DOG_SLEEP_SCALE_Y = (303 / 525) / (241 / 526);
export function sleepArtStyle(type: PetType, size: number): ImageStyle {
  if (type !== "dog") return {};
  return {
    // Native's string parser drops the decimal in "66.5625%" and reads it
    // as "5625%", throwing the pet far outside the room. Numeric coordinates
    // bypass that parser and keep the origin at the source paw baseline.
    transformOrigin: [size / 2, size * 426 / 640, 0],
    transform: [
      { translateY: size * (585 - 426) / 640 },
      { scaleY: DOG_SLEEP_SCALE_Y },
    ],
  };
}
