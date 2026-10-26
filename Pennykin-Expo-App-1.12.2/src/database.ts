import type { SQLiteDatabase } from "expo-sqlite";

import { calendarContextKey, daysBetween, todayKey, weekStartKey } from "./date";
import { getBudgetActuals } from "./transactionQueries";
import { DEFAULT_EQUIPMENT, STARTER_ITEMS } from "./collectibles";
import type {
  CheckinType,
  PetState,
  PetType,
  SavingsGoal,
  Settings,
  SkinId,
  Snapshot,
  GiftBoxType,
  RoomSlot,
  CategoryBudget,
  ReservedExpense,
  ThemeMode,
} from "./types";

type SettingsRow = {
  pet_name: string;
  pet_type: PetType;
  weekly_budget_cents: number;
  last_checkin_date: string | null;
  no_spend_date: string | null;
  onboarding_complete: number;
  checkin_streak: number;
  total_entries_logged: number;
  first_open_date: string;
  theme_mode: ThemeMode;
  large_text: number;
};

type PetRow = {
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

type BadgeRow = { name: string };
type CheckinRow = { checkin_date: string; checkin_type: CheckinType };
type SavingsGoalRow = {
  title: string;
  target_cents: number;
  saved_cents: number;
  created_at: string;
  updated_at: string;
};
type InventoryRow = { item_id: string; acquired_at: string; source: string };
type EquipmentRow = { slot: RoomSlot; item_id: string };
type GiftRow = {
  id: number;
  box_type: GiftBoxType;
  milestone_day: number | null;
  earned_at: string;
  source: string;
};
type CategoryBudgetRow = { category: string; planned_cents: number };
type ReservedExpenseRow = { id: number; title: string; amount_cents: number; week_start: string; created_at: string };

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const today = todayKey();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pet_name TEXT NOT NULL,
      pet_type TEXT NOT NULL,
      weekly_budget_cents INTEGER NOT NULL,
      last_checkin_date TEXT,
      no_spend_date TEXT,
      onboarding_complete INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pet_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hunger INTEGER NOT NULL,
      happiness INTEGER NOT NULL,
      energy INTEGER NOT NULL,
      cleanliness INTEGER NOT NULL,
      health INTEGER NOT NULL,
      xp INTEGER NOT NULL,
      level INTEGER NOT NULL,
      tokens INTEGER NOT NULL,
      coins INTEGER NOT NULL,
      actions_today INTEGER NOT NULL,
      action_date TEXT NOT NULL,
      last_chore_date TEXT,
      last_decay_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      category TEXT NOT NULL,
      note TEXT NOT NULL,
      need_want TEXT NOT NULL CHECK (need_want IN ('Need', 'Want')),
      transaction_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS transactions_by_date
      ON transactions(transaction_date DESC, created_at DESC);

    CREATE TABLE IF NOT EXISTS badges (
      name TEXT PRIMARY KEY,
      earned_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS owned_skins (
      item_id TEXT PRIMARY KEY,
      purchased_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_checkins (
      checkin_date TEXT PRIMARY KEY,
      checkin_type TEXT NOT NULL CHECK (checkin_type IN ('expense', 'no_spend')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS savings_goal (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title TEXT NOT NULL,
      target_cents INTEGER NOT NULL CHECK (target_cents > 0),
      saved_cents INTEGER NOT NULL CHECK (saved_cents >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      item_id TEXT PRIMARY KEY,
      acquired_at TEXT NOT NULL,
      source TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_equipment (
      slot TEXT PRIMARY KEY CHECK (slot IN ('wall', 'floor', 'window', 'furniture', 'decor', 'outfit')),
      item_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gift_boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      box_type TEXT NOT NULL CHECK (box_type IN ('mystery', 'streak')),
      milestone_day INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'opened')),
      earned_at TEXT NOT NULL,
      source TEXT NOT NULL UNIQUE,
      opened_at TEXT,
      reward_summary TEXT
    );

    CREATE TABLE IF NOT EXISTS category_budgets (
      category TEXT PRIMARY KEY,
      planned_cents INTEGER NOT NULL CHECK (planned_cents >= 0)
    );

    CREATE TABLE IF NOT EXISTS reserved_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      week_start TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS reserved_expenses_by_week
      ON reserved_expenses(week_start, created_at DESC);
  `);

  const ensureColumn = async (table: string, column: string, definition: string) => {
    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!columns.some((item) => item.name === column)) {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };
  await ensureColumn("settings", "checkin_streak", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("settings", "total_entries_logged", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("settings", "first_open_date", "TEXT");
  await ensureColumn("settings", "theme_mode", "TEXT NOT NULL DEFAULT 'system'");
  await ensureColumn("settings", "large_text", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("pet_state", "premium_treats", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("pet_state", "toys", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("pet_state", "active_skin", "TEXT NOT NULL DEFAULT 'lavender'");
  await ensureColumn("pet_state", "sleeping_since", "TEXT");
  await ensureColumn("pet_state", "wake_progress", "INTEGER NOT NULL DEFAULT 0");

  await db.runAsync(
    `INSERT OR IGNORE INTO settings
      (id, pet_name, pet_type, weekly_budget_cents, onboarding_complete)
     VALUES (1, 'Pip', 'cat', 5000, 0)`,
  );
  await db.runAsync("UPDATE settings SET first_open_date = COALESCE(first_open_date, ?) WHERE id = 1", today);
  await db.runAsync(
    `INSERT OR IGNORE INTO daily_checkins (checkin_date, checkin_type, created_at)
     SELECT last_checkin_date,
            CASE WHEN no_spend_date = last_checkin_date THEN 'no_spend' ELSE 'expense' END,
            ?
     FROM settings
     WHERE id = 1 AND last_checkin_date IS NOT NULL`,
    new Date().toISOString(),
  );
  for (const itemId of STARTER_ITEMS) {
    await db.runAsync(
      "INSERT OR IGNORE INTO inventory_items (item_id, acquired_at, source) VALUES (?, ?, 'Starter')",
      itemId,
      new Date().toISOString(),
    );
  }
  for (const [slot, itemId] of Object.entries(DEFAULT_EQUIPMENT)) {
    await db.runAsync(
      "INSERT OR IGNORE INTO room_equipment (slot, item_id) VALUES (?, ?)",
      slot,
      itemId,
    );
  }
  await db.execAsync(`
    INSERT OR IGNORE INTO inventory_items (item_id, acquired_at, source)
      SELECT 'mystery_gift', created_at, 'Earlier three-entry reward'
      FROM transactions
      ORDER BY created_at ASC
      LIMIT 1 OFFSET 2;

    INSERT OR IGNORE INTO inventory_items (item_id, acquired_at, source)
      SELECT 'premium_treat', datetime('now'), 'Existing treat inventory'
      FROM pet_state
      WHERE id = 1 AND premium_treats > 0;
  `);
  await db.execAsync(`
    INSERT OR IGNORE INTO inventory_items (item_id, acquired_at, source)
      SELECT CASE item_id
        WHEN 'lavender' THEN 'lavender_wall'
        WHEN 'sunset' THEN 'sunset_wall'
        WHEN 'mint' THEN 'mint_wall'
        WHEN 'midnight' THEN 'midnight_wall'
      END,
      purchased_at,
      'Legacy room skin'
      FROM owned_skins
      WHERE item_id IN ('lavender', 'sunset', 'mint', 'midnight');
  `);
  await db.runAsync(
    "INSERT OR IGNORE INTO owned_skins (item_id, purchased_at) VALUES ('lavender', ?)",
    new Date().toISOString(),
  );
  // Existing installs begin their lifetime counter at their current number of entries.
  await db.runAsync(
    `UPDATE settings SET total_entries_logged =
      CASE WHEN total_entries_logged = 0 THEN (SELECT COUNT(*) FROM transactions)
           ELSE total_entries_logged END
     WHERE id = 1`,
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO pet_state
      (id, hunger, happiness, energy, cleanliness, health, xp, level,
       tokens, coins, actions_today, action_date, last_decay_date)
     VALUES (1, 50, 50, 50, 60, 70, 0, 1, 0, 50, 0, ?, ?)`,
    today,
    today,
  );
}

async function normalizeRealDay(db: SQLiteDatabase, now: Date): Promise<void> {
  const row = await db.getFirstAsync<PetRow>("SELECT * FROM pet_state WHERE id = 1");
  if (!row) throw new Error("Pet data is missing.");
  const settings = await db.getFirstAsync<{ last_checkin_date: string | null }>(
    "SELECT last_checkin_date FROM settings WHERE id = 1",
  );

  const today = todayKey(now);
  const elapsedDays = daysBetween(row.last_decay_date, today);

  let hunger = row.hunger;
  let happiness = row.happiness;
  let energy = row.energy;
  let cleanliness = row.cleanliness;
  let health = row.health;
  let sleepingSince = row.sleeping_since;

  if (elapsedDays > 0) {
    // Absence makes the pet sleepy, never sick or disappointed.
    energy = Math.max(30, clamp(energy - Math.min(20, elapsedDays * 3)));
  }
  if (!sleepingSince && settings?.last_checkin_date && daysBetween(settings.last_checkin_date, today) >= 3) {
    sleepingSince = today;
  }

  await db.runAsync(
    `UPDATE pet_state
     SET hunger = ?, happiness = ?, energy = ?, cleanliness = ?, health = ?,
         last_decay_date = ?, sleeping_since = ?
     WHERE id = 1`,
    hunger,
    happiness,
    energy,
    cleanliness,
    health,
    today,
    sleepingSince,
  );
}

export async function loadSnapshot(db: SQLiteDatabase, now = new Date()): Promise<Snapshot> {
  await normalizeRealDay(db, now);
  let result!: Snapshot;
  // Read profile, budgets and actuals from one database snapshot. All context
  // mutations and refreshes are serialized by AppProvider.
  await db.withExclusiveTransactionAsync(async (txn) => {
    result = await readSnapshot(txn, now);
  });
  return result;
}

async function readSnapshot(db: SQLiteDatabase, now: Date): Promise<Snapshot> {

  const [settingsRow, petRow, financialActuals, checkinRows, goalRow, inventoryRows, equipmentRows, giftRows, badgeRows, categoryBudgetRows, reservedExpenseRows] = await Promise.all([
    db.getFirstAsync<SettingsRow>("SELECT * FROM settings WHERE id = 1"),
    db.getFirstAsync<PetRow>("SELECT * FROM pet_state WHERE id = 1"),
    getBudgetActuals(db, now),
    db.getAllAsync<CheckinRow>("SELECT checkin_date, checkin_type FROM daily_checkins ORDER BY checkin_date DESC"),
    db.getFirstAsync<SavingsGoalRow>("SELECT * FROM savings_goal WHERE id = 1"),
    db.getAllAsync<InventoryRow>("SELECT item_id, acquired_at, source FROM inventory_items ORDER BY acquired_at ASC"),
    db.getAllAsync<EquipmentRow>("SELECT slot, item_id FROM room_equipment"),
    db.getAllAsync<GiftRow>("SELECT id, box_type, milestone_day, earned_at, source FROM gift_boxes WHERE status = 'pending' ORDER BY earned_at ASC, id ASC"),
    db.getAllAsync<BadgeRow>("SELECT name FROM badges ORDER BY earned_at DESC"),
    db.getAllAsync<CategoryBudgetRow>("SELECT category, planned_cents FROM category_budgets ORDER BY category ASC"),
    db.getAllAsync<ReservedExpenseRow>("SELECT id, title, amount_cents, week_start, created_at FROM reserved_expenses WHERE week_start = ? ORDER BY created_at DESC, id DESC", weekStartKey(now)),
  ]);

  if (!settingsRow || !petRow) throw new Error("App data could not be loaded.");

  const settings: Settings = {
    petName: settingsRow.pet_name,
    petType: settingsRow.pet_type,
    weeklyBudgetCents: settingsRow.weekly_budget_cents,
    lastCheckinDate: settingsRow.last_checkin_date,
    noSpendDate: settingsRow.no_spend_date,
    onboardingComplete: settingsRow.onboarding_complete === 1,
    checkinStreak: settingsRow.checkin_streak,
    totalEntriesLogged: settingsRow.total_entries_logged,
    firstOpenDate: settingsRow.first_open_date,
    themeMode: settingsRow.theme_mode === "dark" || settingsRow.theme_mode === "light" ? settingsRow.theme_mode : "system",
    largeText: settingsRow.large_text === 1,
  };

  const pet: PetState = {
    hunger: petRow.hunger,
    happiness: petRow.happiness,
    energy: petRow.energy,
    cleanliness: petRow.cleanliness,
    health: petRow.health,
    xp: petRow.xp,
    level: petRow.level,
    tokens: petRow.tokens,
    coins: petRow.coins,
    premiumTreats: petRow.premium_treats,
    toys: petRow.toys,
    activeSkin: petRow.active_skin,
    lastDecayDate: petRow.last_decay_date,
    sleepingSince: petRow.sleeping_since,
    wakeProgress: petRow.wake_progress,
  };

  const savingsGoal: SavingsGoal | null = goalRow
    ? {
        title: goalRow.title,
        targetCents: goalRow.target_cents,
        savedCents: goalRow.saved_cents,
        createdAt: goalRow.created_at,
        updatedAt: goalRow.updated_at,
      }
    : null;
  const equippedItems: Partial<Record<RoomSlot, string>> = {};
  equipmentRows.forEach((row) => {
    equippedItems[row.slot] = row.item_id;
  });
  const categoryBudgets: CategoryBudget[] = categoryBudgetRows.map((row) => ({
    category: row.category,
    plannedCents: row.planned_cents,
  }));
  const reservedExpenses: ReservedExpense[] = reservedExpenseRows.map((row) => ({
    id: row.id,
    title: row.title,
    amountCents: row.amount_cents,
    weekStart: row.week_start,
    createdAt: row.created_at,
  }));

  return {
    settings,
    pet,
    financialActuals,
    calendarContext: calendarContextKey(now),
    checkins: checkinRows.map((row) => ({ checkinDate: row.checkin_date, checkinType: row.checkin_type })),
    savingsGoal,
    categoryBudgets,
    reservedExpenses,
    ownedItems: inventoryRows.map((row) => ({ itemId: row.item_id, acquiredAt: row.acquired_at, source: row.source })),
    equippedItems,
    pendingGifts: giftRows.map((row) => ({
      id: row.id,
      boxType: row.box_type,
      milestoneDay: row.milestone_day,
      earnedAt: row.earned_at,
      source: row.source,
    })),
    badges: badgeRows.map((row) => row.name),
  };
}
