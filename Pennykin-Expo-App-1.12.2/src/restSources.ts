import type {PetType} from "./types";
import type {AnimationObject} from "lottie-react-native";
// Local JSON and its embedded PNGs are loaded by the resident native view.
export const REST_SOURCES:Record<PetType,AnimationObject>={
 dog:require("../assets/animation/rest-dog/dog.json"),
 cat:require("../assets/animation/rest-cat/cat.json"),
 rabbit:require("../assets/animation/rest-rabbit/rabbit.json"),
};
