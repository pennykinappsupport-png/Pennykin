import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";

import { daysBetween, formatMoney, todayKey, weekStartKey } from "./date";
import { BUDGET_CATEGORIES, getOpportunityCost } from "./budget";
import {
  DEFAULT_EQUIPMENT,
  getCollectible,
  isCollectibleAvailable,
  MYSTERY_COMMON_ITEMS,
  MYSTERY_RARE_ITEMS,
  STARTER_ITEMS,
  STREAK_ITEMS,
} from "./collectibles";
import { clamp, levelForXp } from "./game";
import { createCareMutationQueue } from "./careMutationQueue";
import { loadSnapshot } from "./database";
import { rewardForStreak, rewardLabel } from "./rewards";
import type {
  CheckinType,
  GiftResult,
  PetAction,
  PetState,
  PetType,
  RoomEvent,
  RoomEventType,
  RoomSlot,
  SavingsGoalInput,
  Snapshot,
  ShopItemId,
  SkinId,
  TransactionInput,
  CategoryBudget,
  MoneyInsightNotice,
  ReservedExpenseInput,
  ThemeMode,
} from "./types";

type ProfileInput = {
  petName: string;
  petType: PetType;
  weeklyBudgetCents: number;
};

type AppContextValue = {
  snapshot: Snapshot | null;
  loading: boolean;
  refresh: () => Promise<void>;
  completeOnboarding: (input: ProfileInput) => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
  updateAppearance: (themeMode: ThemeMode, largeText: boolean) => Promise<void>;
  saveTransaction: (input: TransactionInput) => Promise<string>;
  deleteTransaction: (id: number) => Promise<void>;
  markNoSpend: () => Promise<string>;
  performAction: (action: PetAction) => Promise<string>;
  buyItem: (itemId: ShopItemId) => Promise<string>;
  usePremiumTreat: () => Promise<string>;
  equipItem: (itemId: string) => Promise<void>;
  unequipItem: (slot: RoomSlot) => Promise<void>;
  openGift: (giftId: number) => Promise<GiftResult>;
  saveSavingsGoal: (input: SavingsGoalInput) => Promise<void>;
  saveBudgetPlan: (weeklyBudgetCents: number, plans: CategoryBudget[]) => Promise<void>;
  addReservedExpense: (input: ReservedExpenseInput) => Promise<void>;
  deleteReservedExpense: (id: number) => Promise<void>;
  resetAllData: () => Promise<void>;
  roomEvent: RoomEvent | null;
  clearRoomEvent: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

type PetMutationRow = {
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
  health: number;
  xp: number;
  level: number;
  tokens: number;
  coins: number;
  premium_treats: number;
  toys: number;
  active_skin: SkinId;
  last_decay_date: string;
  sleeping_since: string | null;
  wake_progress: number;
};

type WakeResult = { woke: boolean; progress: number } | null;

async function advanceWakeProgress(db: SQLiteDatabase, today: string): Promise<WakeResult> {
  const row = await db.getFirstAsync<{ sleeping_since: string | null; wake_progress: number }>(
    "SELECT sleeping_since, wake_progress FROM pet_state WHERE id = 1",
  );
  if (!row) throw new Error("Pet data is missing.");
  let sleepingSince = row.sleeping_since;
  if (!sleepingSince) {
    const settings = await db.getFirstAsync<{ last_checkin_date: string | null }>(
      "SELECT last_checkin_date FROM settings WHERE id = 1",
    );
    if (settings?.last_checkin_date && daysBetween(settings.last_checkin_date, today) >= 3) {
      sleepingSince = today;
      await db.runAsync("UPDATE pet_state SET sleeping_since = ?, wake_progress = 0 WHERE id = 1", today);
    }
  }
  if (!sleepingSince) return null;
  const progress = row.wake_progress + 1;
  if (progress >= 2) {
    await db.runAsync("UPDATE pet_state SET sleeping_since = NULL, wake_progress = 0, energy = MAX(energy, 45) WHERE id = 1");
    return { woke: true, progress: 2 };
  }
  await db.runAsync("UPDATE pet_state SET wake_progress = ? WHERE id = 1", progress);
  return { woke: false, progress };
}

async function grantDailyReward(
  db: SQLiteDatabase,
  today: string,
  careEnergy: number,
  checkinType: CheckinType,
): Promise<string | null> {
  await db.runAsync(
    `INSERT INTO daily_checkins (checkin_date, checkin_type, created_at)
     VALUES (?, ?, ?)
     ON CONFLICT(checkin_date) DO UPDATE SET checkin_type = excluded.checkin_type`,
    today,
    checkinType,
    new Date().toISOString(),
  );
  const settings = await db.getFirstAsync<{ last_checkin_date: string | null; checkin_streak: number }>(
    "SELECT last_checkin_date, checkin_streak FROM settings WHERE id = 1",
  );
  if (settings?.last_checkin_date === today) return null;
  const consecutive = settings?.last_checkin_date && daysBetween(settings.last_checkin_date, today) === 1;
  const streak = consecutive ? settings.checkin_streak + 1 : 1;
  const reward = rewardForStreak(streak);
  await db.runAsync(
    "UPDATE settings SET last_checkin_date = ?, checkin_streak = ? WHERE id = 1",
    today,
    streak,
  );
  await db.runAsync(
    "UPDATE pet_state SET tokens = tokens + ?, coins = coins + ?, premium_treats = premium_treats + ? WHERE id = 1",
    careEnergy,
    reward.coins,
    reward.treats,
  );
  if (reward.treats > 0) await acquireCollectible(db, "premium_treat", `Day ${reward.day} streak reward`);
  if (STREAK_ITEMS[reward.day]) {
    await db.runAsync(
      `INSERT OR IGNORE INTO gift_boxes
        (box_type, milestone_day, status, earned_at, source)
       VALUES ('streak', ?, 'pending', ?, ?)`,
      reward.day,
      new Date().toISOString(),
      `streak-${today}-${reward.day}`,
    );
    await acquireCollectible(db, "mystery_gift", `Day ${reward.day} streak chest`);
  }
  if (reward.day === 30) await addBadge(db, "30-Day Check-in");
  const chestMessage = STREAK_ITEMS[reward.day] ? " A special streak chest is waiting in your room!" : "";
  return `Day ${reward.day} reward: ${rewardLabel(reward)} and ${careEnergy} care energy.${chestMessage}`;
}

async function addBadge(db: SQLiteDatabase, name: string): Promise<void> {
  await db.runAsync(
    "INSERT OR IGNORE INTO badges (name, earned_at) VALUES (?, ?)",
    name,
    new Date().toISOString(),
  );
}

async function acquireCollectible(db: SQLiteDatabase, itemId: string, source: string): Promise<boolean> {
  const owned = await db.getFirstAsync<{ item_id: string }>(
    "SELECT item_id FROM inventory_items WHERE item_id = ?",
    itemId,
  );
  if (owned) return false;
  await db.runAsync(
    "INSERT INTO inventory_items (item_id, acquired_at, source) VALUES (?, ?, ?)",
    itemId,
    new Date().toISOString(),
    source,
  );
  return true;
}

async function syncPetBadges(
  db: SQLiteDatabase,
  pet: Pick<PetState, "level" | "happiness" | "energy" | "cleanliness" | "health">,
): Promise<void> {
  if (pet.level >= 2) await addBadge(db, "Growing Up");
  if (pet.level >= 3) await addBadge(db, "Big Kid");
  if (pet.level >= 4) await addBadge(db, "Legendary Pet");
  if (pet.happiness >= 90) await addBadge(db, "Super Happy");
  if (pet.energy >= 90) await addBadge(db, "Full of Energy");
  if (pet.cleanliness >= 90) await addBadge(db, "Sparkling Clean");
  if (pet.health >= 90) await addBadge(db, "Healthy Pet");
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const databaseQueue = useRef(createCareMutationQueue()).current;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomEvent, setRoomEvent] = useState<RoomEvent | null>(null);
  const signalRoomEvent = useCallback((type: RoomEventType, moneyInsight?: MoneyInsightNotice) => setRoomEvent({ id: Date.now(), type, moneyInsight }), []);
  const clearRoomEvent = useCallback(() => setRoomEvent(null), []);

  const refresh = useCallback(async () => {
    const next = await loadSnapshot(db);
    setSnapshot(next);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    databaseQueue.run(refresh).catch((error: unknown) => {
      console.error(error);
      setLoading(false);
    });
  }, [databaseQueue, refresh]);

  const writeProfile = useCallback(
    async (input: ProfileInput, finishOnboarding: boolean) => {
      const name = input.petName.trim();
      if (!name) throw new Error("Please give your pet a name.");
      if (input.weeklyBudgetCents <= 0) throw new Error("Weekly budget must be greater than zero.");
      const allocation = await db.getFirstAsync<{ total: number }>("SELECT COALESCE(SUM(planned_cents), 0) AS total FROM category_budgets");
      if ((allocation?.total ?? 0) > input.weeklyBudgetCents) {
        throw new Error("Your category plan is higher than this weekly budget. Adjust the Budget Planner first.");
      }

      await db.runAsync(
        `UPDATE settings
         SET pet_name = ?, pet_type = ?, weekly_budget_cents = ?,
             onboarding_complete = CASE WHEN ? = 1 THEN 1 ELSE onboarding_complete END
         WHERE id = 1`,
        name,
        input.petType,
        input.weeklyBudgetCents,
        finishOnboarding ? 1 : 0,
      );
      await refresh();
    },
    [db, refresh],
  );

  const completeOnboarding = useCallback(
    async (input: ProfileInput) => writeProfile(input, true),
    [writeProfile],
  );

  const updateProfile = useCallback(
    async (input: ProfileInput) => writeProfile(input, false),
    [writeProfile],
  );

  const updateAppearance = useCallback(async (themeMode: ThemeMode, largeText: boolean) => {
    if (!["system", "light", "dark"].includes(themeMode)) throw new Error("Choose a valid appearance mode.");
    await db.runAsync(
      "UPDATE settings SET theme_mode = ?, large_text = ? WHERE id = 1",
      themeMode,
      largeText ? 1 : 0,
    );
    await refresh();
  }, [db, refresh]);

  const saveTransaction = useCallback(
    async (input: TransactionInput) => {
      if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
        throw new Error("Enter an amount greater than $0.00.");
      }
      if (!input.category.trim()) throw new Error("Choose a category.");
      if (!input.note.trim()) throw new Error("Add a short description.");

      const now = new Date();
      const today = todayKey(now);
      let message = "Expense updated.";
      let nextRoomEvent: RoomEventType | null = null;
      let moneyInsight: MoneyInsightNotice | undefined;

      if (input.id === undefined && input.needWant === "Want") {
        // A queued save may run after midnight or after another queued expense.
        // Read the current actuals rather than a stale render's captured snapshot.
        const currentSnapshot = await loadSnapshot(db, now);
        const opportunity = getOpportunityCost(currentSnapshot, input.amountCents);
        const lines: string[] = [];
        if (opportunity.safeDaysEquivalent === null) {
          lines.push("Your flexible amount is currently $0, so this purchase uses room outside today’s flexible plan.");
        } else {
          lines.push(`${formatMoney(input.amountCents)} equals ${opportunity.safeDaysEquivalent.toFixed(1)} days of your current Safe to Spend amount.`);
        }
        if (opportunity.goalName && opportunity.goalGapSharePercent !== null) {
          lines.push(`It also equals ${opportunity.goalGapSharePercent.toFixed(1)}% of what remains for “${opportunity.goalName}.”`);
        } else if (opportunity.weeklyRemainingSharePercent !== null) {
          lines.push(`That is ${opportunity.weeklyRemainingSharePercent.toFixed(1)}% of the weekly budget remaining before this check-in.`);
        }
        lines.push("This is context, not a judgment—the purchase is still honestly recorded.");
        moneyInsight = { title: "Opportunity Cost", amountCents: input.amountCents, lines };
      }

      // The complete financial write is local and atomic. Pet rewards and badges
      // either commit with the expense or roll back with it; no network is in this path.
      await db.withTransactionAsync(async () => {
      if (input.id !== undefined) {
        await db.runAsync(
          `UPDATE transactions
           SET amount_cents = ?, category = ?, note = ?, need_want = ?
           WHERE id = ?`,
          input.amountCents,
          input.category.trim(),
          input.note.trim(),
          input.needWant,
          input.id,
        );
      } else {
        await db.runAsync(
          `INSERT INTO transactions
            (amount_cents, category, note, need_want, transaction_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          input.amountCents,
          input.category.trim(),
          input.note.trim(),
          input.needWant,
          today,
          now.toISOString(),
        );
        await db.runAsync("UPDATE settings SET total_entries_logged = total_entries_logged + 1 WHERE id = 1");
        const counter = await db.getFirstAsync<{ total_entries_logged: number }>(
          "SELECT total_entries_logged FROM settings WHERE id = 1",
        );
        const totalEntries = counter?.total_entries_logged ?? 0;
        const todayCounter = await db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) AS count FROM transactions WHERE transaction_date = ?",
          today,
        );
        const todayEntries = todayCounter?.count ?? 0;
        const wake = await advanceWakeProgress(db, today);
        nextRoomEvent = wake ? (wake.woke ? "awake" : "waking") : totalEntries === 1 ? "first_record" : "recorded";
        if (todayEntries >= 3) {
          const rewardInsert = await db.runAsync(
            `INSERT OR IGNORE INTO gift_boxes
              (box_type, milestone_day, status, earned_at, source)
             VALUES ('mystery', NULL, 'pending', ?, ?)`,
            now.toISOString(),
            `daily-entries-${today}`,
          );
          if (rewardInsert.changes > 0) {
            await db.runAsync("UPDATE pet_state SET coins = coins + 10 WHERE id = 1");
            await acquireCollectible(db, "mystery_gift", `Three honest entries on ${today}`);
            message = "Expense saved. Three honest entries today earned 10 Pet Coins—and your pet brought home today’s mystery gift!";
          } else {
            message = "Expense saved. Today’s three-entry gift was already earned. A new trail starts after midnight.";
          }
        } else {
          const remaining = 3 - todayEntries;
          message = `Expense saved. ${remaining} more honest ${remaining === 1 ? "entry" : "entries"} today until your mystery gift.`;
        }
      }

      // Any real expense replaces a prior no-spend declaration for the same date.
      await db.runAsync(
        `UPDATE settings
         SET no_spend_date = CASE WHEN no_spend_date = ? THEN NULL ELSE no_spend_date END
         WHERE id = 1`,
        today,
      );

      const dailyReward = await grantDailyReward(db, today, 3, "expense");
      if (dailyReward) message += ` ${dailyReward}`;
      const currentPet = await db.getFirstAsync<{ sleeping_since: string | null; wake_progress: number }>("SELECT sleeping_since, wake_progress FROM pet_state WHERE id = 1");
      if (nextRoomEvent === "waking") message += ` ${2 - (currentPet?.wake_progress ?? 0)} more honest check-in will gently wake your pet.`;
      if (nextRoomEvent === "awake") message += " Your pet is awake and celebrating your return!";
      await addBadge(db, "First Entry");
      });
      await refresh();
      if (nextRoomEvent) signalRoomEvent(nextRoomEvent, moneyInsight);
      return message;
    },
    [db, refresh, signalRoomEvent],
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
      await db.runAsync("DELETE FROM transactions WHERE id = ?", id);
      await refresh();
    },
    [db, refresh],
  );

  const markNoSpend = useCallback(async () => {
    const today = todayKey();
    const countRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM transactions WHERE transaction_date = ?",
      today,
    );
    if ((countRow?.count ?? 0) > 0) {
      throw new Error("You already recorded an expense today, so today cannot be marked no-spend.");
    }

    if (snapshot?.settings.noSpendDate === today) return "Today is already marked as a no-spend day.";

    await db.runAsync(
      "UPDATE settings SET no_spend_date = ? WHERE id = 1",
      today,
    );
    const wake = await advanceWakeProgress(db, today);
    const dailyReward = await grantDailyReward(db, today, 3, "no_spend");
    await addBadge(db, "No-Spend Starter");
    await refresh();
    signalRoomEvent(wake ? (wake.woke ? "awake" : "waking") : "no_spend");
    const wakeText = wake ? (wake.woke ? " Your pet woke up and is celebrating!" : " One more honest check-in will wake your pet.") : "";
    return (dailyReward
      ? `No-spend day recorded. ${dailyReward}`
      : "No-spend day recorded. Today’s check-in reward was already claimed.") + wakeText;
  }, [db, refresh, signalRoomEvent, snapshot?.settings.noSpendDate]);

  const performAction = useCallback(
    async (action: PetAction) => {
      const today = todayKey();
      const settings = await db.getFirstAsync<{ last_checkin_date: string | null }>(
        "SELECT last_checkin_date FROM settings WHERE id = 1",
      );
      if (settings?.last_checkin_date !== today) {
        throw new Error("Complete today's financial check-in first.");
      }

      const row = await db.getFirstAsync<PetMutationRow>("SELECT * FROM pet_state WHERE id = 1");
      if (!row) throw new Error("Pet data is missing.");
      if (row.sleeping_since) throw new Error(`Your pet is still sleeping. Complete ${2 - row.wake_progress} more honest check-in to wake them.`);

      let hunger = row.hunger;
      let happiness = row.happiness;
      let energy = row.energy;
      let cleanliness = row.cleanliness;
      let health = row.health;
      let tokens = row.tokens;
      let coins = row.coins;
      let xpGain = 0;
      let message = "";

      switch (action) {
        case "feed":
          if (coins < 3) throw new Error("You need 3 pet coins to buy food.");
          coins -= 3;
          hunger -= 18;
          happiness += 2;
          xpGain = 3;
          message = "A good meal made your pet feel better.";
          break;
        case "play":
          if (tokens < 1) throw new Error("You need 1 care energy to play.");
          tokens -= 1;
          happiness += 15;
          energy -= 12;
          hunger += 7;
          xpGain = 5;
          message = "Playtime was a success!";
          break;
        case "rest":
          energy += 22;
          hunger += 5;
          xpGain = 2;
          message = "Your pet had a peaceful rest.";
          break;
        case "clean":
          if (coins < 2) throw new Error("You need 2 pet coins for cleaning supplies.");
          coins -= 2;
          cleanliness += 25;
          happiness += 3;
          xpGain = 3;
          message = "Fresh, clean, and comfortable!";
          break;
        case "vet":
          if (coins < 20) throw new Error("You need 20 pet coins for a vet visit.");
          coins -= 20;
          health += 35;
          happiness -= 2;
          xpGain = 5;
          message = "The vet helped your pet recover.";
          break;
      }

      // A small natural change happens only after a successful action.
      hunger = clamp(hunger + 2);
      energy = clamp(energy - 1);
      cleanliness = clamp(cleanliness - 1);
      happiness = clamp(happiness);
      if (hunger >= 85 || cleanliness <= 20 || energy <= 10) health -= 4;
      else if (hunger <= 50 && cleanliness >= 50 && energy >= 30) health += 1;
      health = clamp(health);

      const xp = row.xp + xpGain;
      const level = levelForXp(xp);
      await db.runAsync(
        `UPDATE pet_state
         SET hunger = ?, happiness = ?, energy = ?, cleanliness = ?, health = ?,
             xp = ?, level = ?, tokens = ?, coins = ?
         WHERE id = 1`,
        hunger,
        happiness,
        energy,
        cleanliness,
        health,
        xp,
        level,
        tokens,
        coins,
      );

      await syncPetBadges(db, { level, happiness, energy, cleanliness, health });
      await refresh();
      return level > row.level ? `${message} Your pet evolved to Level ${level}!` : message;
    },
    [db, refresh],
  );

  const buyItem = useCallback(async (itemId: ShopItemId) => {
    if (itemId === "premium_treat") {
      const pet = await db.getFirstAsync<{ coins: number }>("SELECT coins FROM pet_state WHERE id = 1");
      if ((pet?.coins ?? 0) < 12) throw new Error("You need 12 Pet Coins.");
      await db.runAsync("UPDATE pet_state SET coins = coins - 12, premium_treats = premium_treats + 1 WHERE id = 1");
      await acquireCollectible(db, "premium_treat", "Shop");
      await refresh();
      return "Premium treat purchased!";
    }
    const item = getCollectible(itemId);
    if (!item || item.price === null || !isCollectibleAvailable(item)) throw new Error("That item is not available in the shop.");
    const pet = await db.getFirstAsync<{ coins: number }>("SELECT coins FROM pet_state WHERE id = 1");
    if ((pet?.coins ?? 0) < item.price) throw new Error(`You need ${item.price} pet coins.`);
    const owned = await db.getFirstAsync<{ item_id: string }>("SELECT item_id FROM inventory_items WHERE item_id = ?", item.id);
    if (owned) throw new Error("You already own this item.");
    await db.runAsync("UPDATE pet_state SET coins = coins - ? WHERE id = 1", item.price);
    await db.runAsync(
      "INSERT INTO inventory_items (item_id, acquired_at, source) VALUES (?, ?, 'Shop')",
      item.id,
      new Date().toISOString(),
    );
    await addBadge(db, "First Purchase");
    await refresh();
    return `${item.name} purchased!`;
  }, [db, refresh]);

  const usePremiumTreat = useCallback(async () => {
    const today = todayKey();
    const settings = await db.getFirstAsync<{ last_checkin_date: string | null }>(
      "SELECT last_checkin_date FROM settings WHERE id = 1",
    );
    if (settings?.last_checkin_date !== today) throw new Error("Complete today's financial check-in first.");
    const row = await db.getFirstAsync<PetMutationRow>("SELECT * FROM pet_state WHERE id = 1");
    if (!row || row.premium_treats < 1) throw new Error("You do not have a premium treat yet.");
    if (row.sleeping_since) throw new Error(`Your pet is still sleeping. Complete ${2 - row.wake_progress} more honest check-in to wake them.`);
    const hunger = clamp(row.hunger - 28);
    const happiness = clamp(row.happiness + 12);
    const xp = row.xp + 5;
    await db.runAsync(
      "UPDATE pet_state SET premium_treats = premium_treats - 1, hunger = ?, happiness = ?, xp = ?, level = ? WHERE id = 1",
      hunger, happiness, xp, levelForXp(xp),
    );
    await refresh();
    return "Your pet loved the premium treat!";
  }, [db, refresh]);

  const equipItem = useCallback(async (itemId: string) => {
    const item = getCollectible(itemId);
    if (!item) throw new Error("That room item does not exist.");
    const owned = await db.getFirstAsync<{ item_id: string }>(
      "SELECT item_id FROM inventory_items WHERE item_id = ?",
      itemId,
    );
    if (!owned) throw new Error("Collect this item before placing it in the room.");
    await db.runAsync(
      `INSERT INTO room_equipment (slot, item_id) VALUES (?, ?)
       ON CONFLICT(slot) DO UPDATE SET item_id = excluded.item_id`,
      item.slot,
      itemId,
    );
    await refresh();
  }, [db, refresh]);

  const unequipItem = useCallback(async (slot: RoomSlot) => {
    await db.runAsync("DELETE FROM room_equipment WHERE slot = ?", slot);
    await refresh();
  }, [db, refresh]);

  const openGift = useCallback(async (giftId: number): Promise<GiftResult> => {
    let result: GiftResult | null = null;
    await db.withTransactionAsync(async () => {
      const gift = await db.getFirstAsync<{
        id: number;
        box_type: "mystery" | "streak";
        milestone_day: number | null;
        status: string;
      }>("SELECT id, box_type, milestone_day, status FROM gift_boxes WHERE id = ?", giftId);
      if (!gift || gift.status !== "pending") throw new Error("This gift has already been opened.");

      if (gift.box_type === "streak" && gift.milestone_day && STREAK_ITEMS[gift.milestone_day]) {
        const itemId = STREAK_ITEMS[gift.milestone_day]!;
        const item = getCollectible(itemId)!;
        const acquired = await acquireCollectible(db, itemId, `Day ${gift.milestone_day} streak chest`);
        if (acquired) {
          result = { title: `${gift.milestone_day}-day treasure!`, message: `${item.name} joined your collection. ${item.story}`, rewardType: "item", itemId };
        } else {
          await db.runAsync("UPDATE pet_state SET coins = coins + 40 WHERE id = 1");
          result = { title: "A familiar treasure", message: `${item.name} was already yours, so it became 40 Pet Coins.`, rewardType: "duplicate", itemId, coins: 40 };
        }
      } else {
        const roll = Math.random();
        if (roll < 0.45) {
          const coinOptions = [5, 8, 12, 15];
          const coins = coinOptions[Math.floor(Math.random() * coinOptions.length)]!;
          await db.runAsync("UPDATE pet_state SET coins = coins + ? WHERE id = 1", coins);
          result = { title: "Pocketful of coins", message: `Your pet found ${coins} Pet Coins tucked inside.`, rewardType: "coins", coins };
        } else if (roll < 0.70) {
          await db.runAsync("UPDATE pet_state SET premium_treats = premium_treats + 1 WHERE id = 1");
          await acquireCollectible(db, "premium_treat", "Mystery gift");
          result = { title: "A special snack", message: "You found one premium treat for your pet.", rewardType: "treat" };
        } else {
          const pool = roll >= 0.95 ? MYSTERY_RARE_ITEMS : MYSTERY_COMMON_ITEMS;
          const itemId = pool[Math.floor(Math.random() * pool.length)]!;
          const item = getCollectible(itemId)!;
          const acquired = await acquireCollectible(db, itemId, "Mystery gift");
          if (acquired) {
            result = { title: item.rarity === "Rare" ? "A rare discovery!" : "Something for the room", message: `${item.name} joined your collection. ${item.story}`, rewardType: "item", itemId };
            if (item.rarity === "Rare") await addBadge(db, "Lucky Find");
          } else {
            const coins = item.rarity === "Rare" ? 35 : 12;
            await db.runAsync("UPDATE pet_state SET coins = coins + ? WHERE id = 1", coins);
            result = { title: "Duplicate transformed", message: `You already owned ${item.name}, so it became ${coins} Pet Coins.`, rewardType: "duplicate", itemId, coins };
          }
        }
      }

      if (!result) throw new Error("The gift could not be opened.");
      await db.runAsync(
        "UPDATE gift_boxes SET status = 'opened', opened_at = ?, reward_summary = ? WHERE id = ?",
        new Date().toISOString(),
        result.message,
        giftId,
      );
      await addBadge(db, "First Mystery Gift");
    });
    await refresh();
    if (!result) throw new Error("The gift could not be opened.");
    return result;
  }, [db, refresh]);

  const saveSavingsGoal = useCallback(async (input: SavingsGoalInput) => {
    const title = input.title.trim();
    if (!title) throw new Error("Give your savings goal a name.");
    if (!Number.isInteger(input.targetCents) || input.targetCents <= 0) {
      throw new Error("Savings target must be greater than $0.00.");
    }
    if (!Number.isInteger(input.savedCents) || input.savedCents < 0) {
      throw new Error("Saved amount cannot be negative.");
    }
    const oldGoal = await db.getFirstAsync<{ target_cents: number; saved_cents: number }>("SELECT target_cents, saved_cents FROM savings_goal WHERE id = 1");
    const oldProgress = oldGoal && oldGoal.target_cents > 0 ? oldGoal.saved_cents / oldGoal.target_cents : 0;
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO savings_goal (id, title, target_cents, saved_cents, created_at, updated_at)
       VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         target_cents = excluded.target_cents,
         saved_cents = excluded.saved_cents,
         updated_at = excluded.updated_at`,
      title,
      input.targetCents,
      input.savedCents,
      now,
      now,
    );
    const progress = input.savedCents / input.targetCents;
    if (progress >= 0.25) await addBadge(db, "Goal: 25%");
    if (progress >= 0.5) await addBadge(db, "Goal: Halfway");
    if (progress >= 1) await addBadge(db, "Goal Complete");
    await refresh();
    if (oldProgress < 1 && progress >= 1) signalRoomEvent("goal_complete");
    else if (oldProgress < 0.5 && progress >= 0.5) signalRoomEvent("goal_50");
    else if (oldProgress < 0.25 && progress >= 0.25) signalRoomEvent("goal_25");
  }, [db, refresh, signalRoomEvent]);

  const saveBudgetPlan = useCallback(async (weeklyBudgetCents: number, plans: CategoryBudget[]) => {
    if (!Number.isInteger(weeklyBudgetCents) || weeklyBudgetCents <= 0) {
      throw new Error("Weekly budget must be greater than zero.");
    }
    const allowed = new Set<string>(BUDGET_CATEGORIES);
    if (plans.some((plan) => !allowed.has(plan.category) || !Number.isInteger(plan.plannedCents) || plan.plannedCents < 0)) {
      throw new Error("One of the category plans is invalid.");
    }
    const allocated = plans.reduce((sum, plan) => sum + plan.plannedCents, 0);
    if (allocated > weeklyBudgetCents) {
      throw new Error("Category plans cannot exceed your weekly budget.");
    }
    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE settings SET weekly_budget_cents = ? WHERE id = 1", weeklyBudgetCents);
      await db.runAsync("DELETE FROM category_budgets");
      for (const plan of plans) {
        if (plan.plannedCents > 0) {
          await db.runAsync("INSERT INTO category_budgets (category, planned_cents) VALUES (?, ?)", plan.category, plan.plannedCents);
        }
      }
    });
    await refresh();
  }, [db, refresh]);

  const addReservedExpense = useCallback(async (input: ReservedExpenseInput) => {
    const title = input.title.trim();
    if (!title) throw new Error("Give this reserved expense a short name.");
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new Error("Reserved amount must be greater than zero.");
    const now = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO reserved_expenses (title, amount_cents, week_start, created_at) VALUES (?, ?, ?, ?)",
      title,
      input.amountCents,
      weekStartKey(),
      now,
    );
    await refresh();
  }, [db, refresh]);

  const deleteReservedExpense = useCallback(async (id: number) => {
    await db.runAsync("DELETE FROM reserved_expenses WHERE id = ?", id);
    await refresh();
  }, [db, refresh]);

  const resetAllData = useCallback(async () => {
    const today = todayKey();
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        DELETE FROM transactions;
        DELETE FROM daily_checkins;
        DELETE FROM savings_goal;
        DELETE FROM category_budgets;
        DELETE FROM reserved_expenses;
        DELETE FROM badges;
        DELETE FROM owned_skins;
        DELETE FROM gift_boxes;
        DELETE FROM room_equipment;
        DELETE FROM inventory_items;
      `);
      await db.runAsync(
        `UPDATE settings SET
          pet_name = 'Pip', pet_type = 'cat', weekly_budget_cents = 5000,
          last_checkin_date = NULL, no_spend_date = NULL,
          onboarding_complete = 0, checkin_streak = 0,
          total_entries_logged = 0, first_open_date = ?,
          theme_mode = 'system', large_text = 0
         WHERE id = 1`,
        today,
      );
      for (const itemId of STARTER_ITEMS) {
        await db.runAsync(
          "INSERT INTO inventory_items (item_id, acquired_at, source) VALUES (?, ?, 'Starter')",
          itemId,
          new Date().toISOString(),
        );
      }
      for (const [slot, itemId] of Object.entries(DEFAULT_EQUIPMENT)) {
        await db.runAsync("INSERT INTO room_equipment (slot, item_id) VALUES (?, ?)", slot, itemId);
      }
      await db.runAsync(
        `UPDATE pet_state SET
          hunger = 50, happiness = 50, energy = 50, cleanliness = 60,
          health = 70, xp = 0, level = 1, tokens = 0, coins = 50,
          premium_treats = 0, toys = 0, active_skin = 'lavender',
          last_decay_date = ?, sleeping_since = NULL, wake_progress = 0
         WHERE id = 1`,
        today,
      );
      await db.runAsync(
        "INSERT INTO owned_skins (item_id, purchased_at) VALUES ('lavender', ?)",
        new Date().toISOString(),
      );
    });
    await refresh();
  }, [db, refresh]);

  const value = useMemo<AppContextValue>(
    () => ({
      snapshot,
      loading,
      refresh: (...args: Parameters<typeof refresh>) => databaseQueue.run(() => refresh(...args)),
      completeOnboarding: (...args: Parameters<typeof completeOnboarding>) => databaseQueue.run(() => completeOnboarding(...args)),
      updateProfile: (...args: Parameters<typeof updateProfile>) => databaseQueue.run(() => updateProfile(...args)),
      updateAppearance: (...args: Parameters<typeof updateAppearance>) => databaseQueue.run(() => updateAppearance(...args)),
      saveTransaction: (...args: Parameters<typeof saveTransaction>) => databaseQueue.run(() => saveTransaction(...args)),
      deleteTransaction: (...args: Parameters<typeof deleteTransaction>) => databaseQueue.run(() => deleteTransaction(...args)),
      markNoSpend: (...args: Parameters<typeof markNoSpend>) => databaseQueue.run(() => markNoSpend(...args)),
      performAction: (...args: Parameters<typeof performAction>) => databaseQueue.run(() => performAction(...args)),
      buyItem: (...args: Parameters<typeof buyItem>) => databaseQueue.run(() => buyItem(...args)),
      usePremiumTreat: (...args: Parameters<typeof usePremiumTreat>) => databaseQueue.run(() => usePremiumTreat(...args)),
      equipItem: (...args: Parameters<typeof equipItem>) => databaseQueue.run(() => equipItem(...args)),
      unequipItem: (...args: Parameters<typeof unequipItem>) => databaseQueue.run(() => unequipItem(...args)),
      openGift: (...args: Parameters<typeof openGift>) => databaseQueue.run(() => openGift(...args)),
      saveSavingsGoal: (...args: Parameters<typeof saveSavingsGoal>) => databaseQueue.run(() => saveSavingsGoal(...args)),
      saveBudgetPlan: (...args: Parameters<typeof saveBudgetPlan>) => databaseQueue.run(() => saveBudgetPlan(...args)),
      addReservedExpense: (...args: Parameters<typeof addReservedExpense>) => databaseQueue.run(() => addReservedExpense(...args)),
      deleteReservedExpense: (...args: Parameters<typeof deleteReservedExpense>) => databaseQueue.run(() => deleteReservedExpense(...args)),
      resetAllData: (...args: Parameters<typeof resetAllData>) => databaseQueue.run(() => resetAllData(...args)),
      roomEvent,
      clearRoomEvent,
    }),
    [
      databaseQueue,
      snapshot,
      loading,
      refresh,
      completeOnboarding,
      updateProfile,
      updateAppearance,
      saveTransaction,
      deleteTransaction,
      markNoSpend,
      performAction,
      buyItem,
      usePremiumTreat,
      equipItem,
      unequipItem,
      openGift,
      saveSavingsGoal,
      saveBudgetPlan,
      addReservedExpense,
      deleteReservedExpense,
      resetAllData,
      roomEvent,
      clearRoomEvent,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider.");
  return value;
}
