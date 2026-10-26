import type { ImageSourcePropType } from "react-native";

import type { PetType } from "./types";

export const PET_IMAGES: Record<PetType, ImageSourcePropType> = {
  cat: require("../assets/pets/cat.png"),
  dog: require("../assets/pets/dog.png"),
  rabbit: require("../assets/pets/rabbit.png"),
};

export const PET_BLINK_IMAGES: Record<PetType, ImageSourcePropType> = {
  cat: require("../assets/pets/cat-blink.png"),
  dog: require("../assets/pets/dog-blink.png"),
  rabbit: require("../assets/pets/rabbit-blink.png"),
};

export const PET_REST_IMAGES: Record<PetType, ImageSourcePropType> = {
  cat: require("../assets/animation/cat-rest.png"),
  dog: require("../assets/animation/dog-rest.png"),
  rabbit: require("../assets/animation/rabbit-rest.png"),
};

export const PET_EAT_IMAGES: Record<PetType, ImageSourcePropType> = {
  cat: require("../assets/animation/cat-eat.png"),
  dog: require("../assets/animation/dog-eat.png"),
  rabbit: require("../assets/animation/rabbit-eat.png"),
};

export const PET_PLAY_GRAB_IMAGES: Record<PetType, ImageSourcePropType> = {
  cat: require("../assets/animation/cat-play-grab.png"),
  dog: require("../assets/animation/dog-play-grab.png"),
  rabbit: require("../assets/animation/rabbit-play-grab.png"),
};

export const CAT_CARE_ATLAS: ImageSourcePropType = require("../assets/animation/cat-care-atlas.png");
export const CAT_LICK_IMAGE: ImageSourcePropType = require("../assets/animation/cat-paw-lick.png");
// Order matches the shared care controller: receive, eat, satisfied, wipe, lick.
export const PET_CARE_POSES: Record<"dog" | "rabbit", readonly ImageSourcePropType[]> = {
  dog: [
    require("../assets/animation/dog-care-receive.png"),
    require("../assets/animation/dog-care-eat.png"),
    require("../assets/animation/dog-care-satisfied.png"),
    require("../assets/animation/dog-care-wipe.png"),
    require("../assets/animation/dog-care-lick.png"),
  ],
  rabbit: [
    require("../assets/animation/rabbit-care-receive.png"),
    require("../assets/animation/rabbit-care-eat.png"),
    require("../assets/animation/rabbit-care-satisfied.png"),
    require("../assets/animation/rabbit-care-wipe.png"),
    require("../assets/animation/rabbit-care-lick.png"),
  ],
};
export const CAT_VET_ATLAS: ImageSourcePropType = require("../assets/animation/cat-vet-atlas.png");

export const CAT_PLAY_ATLAS: ImageSourcePropType = require("../assets/animation/cat-play-atlas.png");

export const CAT_PLAY_CLEAN_ATLAS: ImageSourcePropType = require("../assets/animation/cat-play-clean-atlas.png");

export const CAT_REST_ATLAS: ImageSourcePropType = require("../assets/animation/cat-rest-atlas.png");

// Empty-handed Play poses: crouch, run A, run B, pounce, hug, cheer.
export const ANIMAL_PLAY_POSES: Record<"dog" | "rabbit", readonly ImageSourcePropType[]> = {
  dog: [
    require("../assets/animation/play/dog-0.png"),
    require("../assets/animation/play/dog-1.png"),
    require("../assets/animation/play/dog-2.png"),
    require("../assets/animation/play/dog-3.png"),
    require("../assets/animation/play/dog-4.png"),
    require("../assets/animation/play/dog-5.png"),
  ],
  rabbit: [
    require("../assets/animation/play/rabbit-0.png"),
    require("../assets/animation/play/rabbit-1.png"),
    require("../assets/animation/play/rabbit-2.png"),
    require("../assets/animation/play/rabbit-3.png"),
    require("../assets/animation/play/rabbit-4.png"),
    require("../assets/animation/play/rabbit-5.png"),
  ],
};

