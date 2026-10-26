export type TabName = "home" | "transactions" | "shop" | "insights";
export type NeedWant = "Need" | "Want";
export type ThemeMode = "system" | "light" | "dark";
export type CheckinType = "expense" | "no_spend";
export type PetType = "cat" | "dog" | "rabbit";
export type PetAction = "feed" | "play" | "rest" | "clean" | "vet";
export type SkinId = "lavender" | "sunset" | "mint" | "midnight";
export type ShopItemId = string;
export type Rarity = "Common" | "Rare" | "Streak" | "Seasonal";
export type RoomSlot = "wall" | "floor" | "window" | "furniture" | "decor" | "outfit";
export type GiftBoxType = "mystery" | "streak";
export type PetVisualState =
  | "calm"
  | "curious"
  | "celebrate"
  | "sleeping"
  | "worried"
  | "peek"
  | "saving"
  | "eating"
  | "playing"
  | "bathing"
  | "vet"
  | "gift"
  | "waking";

export type RoomEventType = "first_record" | "recorded" | "no_spend" | "waking" | "awake" | "goal_25" | "goal_50" | "goal_complete";

export interface RoomEvent {
  id: number;
  type: RoomEventType;
  moneyInsight?: MoneyInsightNotice;
}

export interface MoneyInsightNotice {
  title: string;
  amountCents: number;
  lines: string[];
}

export interface Settings {
  petName: string;
  petType: PetType;
  weeklyBudgetCents: number;
  lastCheckinDate: string | null;
  noSpendDate: string | null;
  onboardingComplete: boolean;
  checkinStreak: number;
  totalEntriesLogged: number;
  firstOpenDate: string;
  themeMode: ThemeMode;
  largeText: boolean;
}

export interface PetState {
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
  health: number;
  xp: number;
  level: number;
  tokens: number;
  coins: number;
  premiumTreats: number;
  toys: number;
  activeSkin: SkinId;
  lastDecayDate: string;
  sleepingSince: string | null;
  wakeProgress: number;
}

export interface Transaction {
  id: number;
  amountCents: number;
  category: string;
  note: string;
  needWant: NeedWant;
  transactionDate: string;
  createdAt: string;
}

export interface TransactionInput {
  id?: number;
  amountCents: number;
  category: string;
  note: string;
  needWant: NeedWant;
}

export interface DailyCheckin {
  checkinDate: string;
  checkinType: CheckinType;
}

export interface SavingsGoal {
  title: string;
  targetCents: number;
  savedCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalInput {
  title: string;
  targetCents: number;
  savedCents: number;
}

export interface CategoryBudget {
  category: string;
  plannedCents: number;
}

export interface ReservedExpense {
  id: number;
  title: string;
  amountCents: number;
  weekStart: string;
  createdAt: string;
}

export interface ReservedExpenseInput {
  title: string;
  amountCents: number;
}

export interface OwnedItem {
  itemId: string;
  acquiredAt: string;
  source: string;
}

export interface PendingGift {
  id: number;
  boxType: GiftBoxType;
  milestoneDay: number | null;
  earnedAt: string;
  source: string;
}

export interface GiftResult {
  title: string;
  message: string;
  rewardType: "coins" | "treat" | "item" | "duplicate";
  itemId?: string;
  coins?: number;
}

export interface Snapshot {
  settings: Settings;
  pet: PetState;
  financialActuals: import("./transactionQueries").BudgetActuals;
  calendarContext: string;
  checkins: DailyCheckin[];
  savingsGoal: SavingsGoal | null;
  categoryBudgets: CategoryBudget[];
  reservedExpenses: ReservedExpense[];
  ownedItems: OwnedItem[];
  equippedItems: Partial<Record<RoomSlot, string>>;
  pendingGifts: PendingGift[];
  badges: string[];
}
