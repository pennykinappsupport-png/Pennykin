import type { PetAction, PetState } from "./types";

export const actionInfo: Record<
  PetAction,
  { emoji: string; label: string; detail: string }
> = {
  feed: { emoji: "🥣", label: "Feed", detail: "3 coins" },
  play: { emoji: "🎾", label: "Play", detail: "1 energy" },
  rest: { emoji: "🌙", label: "Rest", detail: "Free" },
  clean: { emoji: "🫧", label: "Clean", detail: "2 coins" },
  vet: { emoji: "🩺", label: "Vet", detail: "20 coins" },
};

export function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function levelForXp(xp: number): number {
  if (xp >= 500) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
}

export function stageForLevel(level: number): string {
  return ["Baby", "Teen", "Adult", "Legend"][Math.max(0, Math.min(3, level - 1))] ?? "Baby";
}

export function moodForPet(pet: PetState): { label: string; emoji: string } {
  if (pet.health <= 25) return { label: "Sick", emoji: "🤒" };
  if (pet.hunger >= 80) return { label: "Hungry", emoji: "😿" };
  if (pet.energy <= 20) return { label: "Tired", emoji: "😴" };
  if (pet.happiness <= 20) return { label: "Sad", emoji: "🥺" };
  if (pet.happiness >= 80 && pet.energy >= 50 && pet.hunger <= 40 && pet.health >= 60) {
    return { label: "Happy", emoji: "😄" };
  }
  return { label: "Doing okay", emoji: "🙂" };
}
