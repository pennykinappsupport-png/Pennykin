import type { Rarity, RoomSlot } from "./types";

export type Collectible = {
  id: string;
  name: string;
  description: string;
  story: string;
  rarity: Rarity;
  slot: RoomSlot;
  price: number | null;
  source: "Starter" | "Shop" | "Mystery gift" | "Streak chest" | "Seasonal shop";
  seasonMonths?: number[];
};

export type CatalogSpecial = Omit<Collectible, "slot" | "source"> & {
  slot: "special";
  source: "Three entries in one day" | "Shop or mystery gift";
};

export type CatalogItem = Collectible | CatalogSpecial;

export const COLLECTIBLES: Collectible[] = [
  { id: "lavender_wall", name: "Lavender morning", description: "Soft lavender wallpaper for a calm start.", story: "The first wall your little home grew around.", rarity: "Common", slot: "wall", price: null, source: "Starter" },
  { id: "sunset_wall", name: "Peach sunset", description: "Warm peach wallpaper with an evening glow.", story: "A reminder that small routines can close a busy day gently.", rarity: "Common", slot: "wall", price: 40, source: "Shop" },
  { id: "mint_wall", name: "Mint garden", description: "Fresh green walls with tiny leaf marks.", story: "New habits take root one honest check-in at a time.", rarity: "Common", slot: "wall", price: 40, source: "Shop" },
  { id: "midnight_wall", name: "Midnight study", description: "Deep blue walls dotted with quiet stars.", story: "For late-night thinkers and patient planners.", rarity: "Common", slot: "wall", price: 60, source: "Shop" },
  { id: "wood_floor", name: "Honey wood floor", description: "A warm floor included with every first room.", story: "Every home needs somewhere sturdy to begin.", rarity: "Common", slot: "floor", price: null, source: "Starter" },
  { id: "cloud_rug", name: "Cloud rug", description: "A soft cream rug shaped like a cloud.", story: "Pip insists this is the best place to think about tomorrow.", rarity: "Common", slot: "floor", price: 35, source: "Shop" },
  { id: "star_rug", name: "Twenty-one star rug", description: "A midnight rug earned on a 21-day streak.", story: "Twenty-one small choices stitched into one bright star.", rarity: "Streak", slot: "floor", price: null, source: "Streak chest" },
  { id: "round_window", name: "Morning window", description: "A round window with a clear blue sky.", story: "There is always another day to begin again.", rarity: "Common", slot: "window", price: null, source: "Starter" },
  { id: "rainy_window", name: "Rainy-day window", description: "A rare window with silver raindrops.", story: "Some days are for progress; some are for listening to rain.", rarity: "Rare", slot: "window", price: null, source: "Mystery gift" },
  { id: "cozy_cushion", name: "Starter cushion", description: "A round cushion in the corner of the room.", story: "Your pet waited here before you made your first entry.", rarity: "Common", slot: "furniture", price: null, source: "Starter" },
  { id: "reading_chair", name: "Reading chair", description: "A lavender chair with a curved back.", story: "A good seat for reviewing a week without judging it.", rarity: "Common", slot: "furniture", price: 55, source: "Shop" },
  { id: "tiny_table", name: "Tiny planning table", description: "A small table for lists, tea, and dreams.", story: "Big plans often begin on very small tables.", rarity: "Common", slot: "furniture", price: 45, source: "Shop" },
  { id: "leaf_plant", name: "Patient plant", description: "A cheerful plant in a golden pot.", story: "It grows slowly, which is exactly the point.", rarity: "Common", slot: "decor", price: 30, source: "Shop" },
  { id: "star_plush", name: "Pocket star", description: "A small star plush for the room.", story: "Found on a night when one honest entry felt like enough.", rarity: "Common", slot: "decor", price: 25, source: "Shop" },
  { id: "moon_lamp", name: "Moonkeeper lamp", description: "A rare lamp with a warm crescent glow.", story: "It stays awake so your pet does not have to.", rarity: "Rare", slot: "decor", price: null, source: "Mystery gift" },
  { id: "seven_day_banner", name: "Seven-day banner", description: "A small banner for a full week of check-ins.", story: "Seven honest days, including the imperfect ones.", rarity: "Streak", slot: "decor", price: null, source: "Streak chest" },
  { id: "fourteen_day_lantern", name: "Fourteen-day lantern", description: "A glowing lantern earned at day 14.", story: "Two weeks of noticing where your money went.", rarity: "Streak", slot: "decor", price: null, source: "Streak chest" },
  { id: "thirty_day_arch", name: "Thirty-day celebration", description: "A festive arch for completing 30 days.", story: "Not a perfect month—an honest one.", rarity: "Streak", slot: "decor", price: null, source: "Streak chest" },
  { id: "lavender_scarf", name: "Lavender scarf", description: "A soft scarf for your companion.", story: "Made for breezy walks past imaginary shop windows.", rarity: "Common", slot: "outfit", price: 45, source: "Shop" },
  { id: "gold_crown", name: "Lucky little crown", description: "An exceptionally rare golden crown.", story: "It does not make anyone richer. It does make breakfast more royal.", rarity: "Rare", slot: "outfit", price: null, source: "Mystery gift" },
  { id: "pumpkin_lamp", name: "Pumpkin glow", description: "An October-only room light.", story: "A tiny autumn light for brave budgeters.", rarity: "Seasonal", slot: "decor", price: 55, source: "Seasonal shop", seasonMonths: [10] },
  { id: "snow_globe", name: "Snowy keepsake", description: "A December-only snow globe.", story: "Shake gently: every flake is a small choice remembered.", rarity: "Seasonal", slot: "decor", price: 55, source: "Seasonal shop", seasonMonths: [12] },
];

export const SPECIAL_CATALOG_ITEMS: CatalogSpecial[] = [
  {
    id: "mystery_gift",
    name: "Pawprint mystery gift",
    description: "A ribboned surprise your pet carries home after three honest entries.",
    story: "It rattles differently every time, but it always remembers the three small check-ins that brought it home.",
    rarity: "Rare",
    slot: "special",
    price: null,
    source: "Three entries in one day",
  },
  {
    id: "premium_treat",
    name: "Berry biscuit pouch",
    description: "A hand-wrapped snack saved for pet-care time.",
    story: "The paper is folded like a tiny picnic bag, with one biscuit kept for a particularly gentle afternoon.",
    rarity: "Common",
    slot: "special",
    price: 12,
    source: "Shop or mystery gift",
  },
];

export const COLLECTION_CATALOG: CatalogItem[] = [...COLLECTIBLES, ...SPECIAL_CATALOG_ITEMS];

export function isRoomCollectible(item: CatalogItem): item is Collectible {
  return item.slot !== "special";
}

export const STARTER_ITEMS = ["lavender_wall", "wood_floor", "round_window", "cozy_cushion"];

export const DEFAULT_EQUIPMENT: Partial<Record<RoomSlot, string>> = {
  wall: "lavender_wall",
  floor: "wood_floor",
  window: "round_window",
  furniture: "cozy_cushion",
};

export const MYSTERY_COMMON_ITEMS = ["cloud_rug", "leaf_plant", "star_plush", "lavender_scarf"];
export const MYSTERY_RARE_ITEMS = ["rainy_window", "moon_lamp", "gold_crown"];

export const STREAK_ITEMS: Record<number, string> = {
  7: "seven_day_banner",
  14: "fourteen_day_lantern",
  21: "star_rug",
  30: "thirty_day_arch",
};

export function getCollectible(id: string): Collectible | undefined {
  return COLLECTIBLES.find((item) => item.id === id);
}

export function isCollectibleAvailable(item: Pick<CatalogItem, "seasonMonths">, month = new Date().getMonth() + 1): boolean {
  return !item.seasonMonths || item.seasonMonths.includes(month);
}
