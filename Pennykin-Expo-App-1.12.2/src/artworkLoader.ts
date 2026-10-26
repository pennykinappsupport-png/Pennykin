import { Image, type ImageSourcePropType } from "react-native";

import { preloadBathComposition } from "./bathSources";
import type { PetType } from "./types";
import { ITEM_IMAGES } from "./itemImages";
import { PET_BLINK_IMAGES, PET_EAT_IMAGES, PET_IMAGES, CAT_PLAY_CLEAN_ATLAS, PET_REST_IMAGES } from "./petImages";

const ARTWORK_SOURCES = [
  ...Object.values(PET_IMAGES),
  ...Object.values(PET_BLINK_IMAGES),
  ...Object.values(PET_REST_IMAGES),
  ...Object.values(PET_EAT_IMAGES),
  CAT_PLAY_CLEAN_ATLAS,
  ...Object.values(ITEM_IMAGES),
];
const ROOM_ITEM_IDS = ["round_window", "cozy_cushion", "cloud_rug", "leaf_plant", "lavender_scarf", "gold_crown"];

function pause(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const warmed = new Map<string, Promise<boolean>>();
function warmSource(source: ImageSourcePropType): Promise<boolean> {
  const uri = Image.resolveAssetSource(source)?.uri;
  if (!uri) return Promise.resolve(false);
  const existing = warmed.get(uri);
  if(existing) return existing;
  const pending = fetchSource(uri).then(ok=>{if(!ok)warmed.delete(uri);return ok;});
  warmed.set(uri,pending);
  return pending;
}
async function fetchSource(uri: string): Promise<boolean> {

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      if (await Image.prefetch(uri)) return true;
    } catch {
      // A development server can briefly miss an asset while Metro is starting.
    }
    if (attempt === 0) await pause(180);
  }
  return false;
}

async function warmInSmallBatches(sources: ImageSourcePropType[]) {
  let failed = 0;
  for (let index = 0; index < sources.length; index += 4) {
    const results = await Promise.all(sources.slice(index, index + 4).map(warmSource));
    failed += results.filter((loaded) => !loaded).length;
  }
  return { failed, total: sources.length };
}

export function preloadRoomArtwork() {
  const roomSources = [
    ...Object.values(PET_IMAGES),
    ...Object.values(PET_BLINK_IMAGES),
    ...Object.values(PET_REST_IMAGES),
    ...Object.values(PET_EAT_IMAGES),
    CAT_PLAY_CLEAN_ATLAS,
        ...ROOM_ITEM_IDS.map((id) => ITEM_IMAGES[id]).filter((source): source is ImageSourcePropType => Boolean(source)),
  ];
  return warmInSmallBatches(roomSources);
}

export function preloadAllArtwork() {
  return warmInSmallBatches(ARTWORK_SOURCES);
}

// JSON is bundled and parsed at startup; the selected native composition is
// loaded by the hidden resident Lottie view before a request can play.
export async function preloadBathArtwork(type: PetType) {
  preloadBathComposition(type);
  return {failed:0,total:1};
}
