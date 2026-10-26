import type { SQLiteDatabase } from "expo-sqlite";
import { addCalendarDays, parseDateKey, todayKey, weekStartKey } from "./date";
import type { AnalyticsPeriod } from "./analytics";
import type { Transaction } from "./types";

function validateRange(range: DateRange) {
  parseDateKey(range.startKey); parseDateKey(range.endExclusiveKey);
  if (range.startKey >= range.endExclusiveKey) throw new Error("Date range must end after it starts.");
}

type Reader = Pick<SQLiteDatabase, "getAllAsync">;
export type DateRange = { startKey: string; endExclusiveKey: string };
export type Aggregate = { totalCents: number; needsCents: number; entryCount: number };
export type SpendingSummary = Aggregate & {
  categories: Array<Aggregate & { key: string }>;
  buckets: Record<string, Aggregate>;
};
export type BudgetActuals = Aggregate & {
  dateKey: string;
  weekStart: string;
  categorySpentCents: Record<string, number>;
  todayCount: number;
  todaySpentCents: number;
  yesterdaySpentCents: number;
};

// All arms read the same filtered CTE in ONE SQLite statement/snapshot. No list
// pagination, JS financial reduction, or per-category round trips are involved.
export async function getSpendingSummary(db: Reader, range: DateRange, period: AnalyticsPeriod): Promise<SpendingSummary> {
  validateRange(range);
  const bucket = period === "day" ? "CAST(CAST(strftime('%H', created_at, 'localtime') AS INTEGER) / 4 AS INTEGER)"
    : period === "week" ? "transaction_date"
    : period === "month" ? "CAST((CAST(substr(transaction_date, 9, 2) AS INTEGER) - 1) / 7 AS INTEGER)"
    : "CAST(substr(transaction_date, 6, 2) AS INTEGER) - 1";
  const rows = await db.getAllAsync<Aggregate & { kind: string; key: string }>(`
    WITH filtered AS (
      SELECT amount_cents, need_want, category, ${bucket} AS bucket
      FROM transactions WHERE transaction_date >= ? AND transaction_date < ?
    )
    SELECT 'total' AS kind, '' AS key,
      COALESCE(SUM(amount_cents), 0) AS totalCents,
      COALESCE(SUM(CASE WHEN need_want = 'Need' THEN amount_cents ELSE 0 END), 0) AS needsCents,
      COUNT(*) AS entryCount FROM filtered
    UNION ALL
    SELECT 'category', category, SUM(amount_cents),
      SUM(CASE WHEN need_want = 'Need' THEN amount_cents ELSE 0 END), COUNT(*)
      FROM filtered GROUP BY category
    UNION ALL
    SELECT 'bucket', CAST(bucket AS TEXT), SUM(amount_cents),
      SUM(CASE WHEN need_want = 'Need' THEN amount_cents ELSE 0 END), COUNT(*)
      FROM filtered GROUP BY bucket
  `, range.startKey, range.endExclusiveKey);
  const result: SpendingSummary = { totalCents: 0, needsCents: 0, entryCount: 0, categories: [], buckets: {} };
  for (const row of rows) {
    const value = { totalCents: row.totalCents, needsCents: row.needsCents, entryCount: row.entryCount };
    if (row.kind === "total") Object.assign(result, value);
    else if (row.kind === "category") result.categories.push({ ...value, key: row.key });
    else result.buckets[row.key] = value;
  }
  result.categories.sort((a, b) => b.totalCents - a.totalCents || a.key.localeCompare(b.key));
  return result;
}

export async function getBudgetActuals(db: Reader, now = new Date()): Promise<BudgetActuals> {
  const dateKey = todayKey(now), weekStart = weekStartKey(now);
  const summary = await getSpendingSummary(db, { startKey: weekStart, endExclusiveKey: addCalendarDays(weekStart, 7) }, "week");
  return {
    totalCents: summary.totalCents, needsCents: summary.needsCents, entryCount: summary.entryCount,
    dateKey, weekStart,
    categorySpentCents: Object.fromEntries(summary.categories.map((item) => [item.key, item.totalCents])),
    todayCount: summary.buckets[dateKey]?.entryCount ?? 0,
    todaySpentCents: summary.buckets[dateKey]?.totalCents ?? 0,
    // Preserve the current budget's Monday reset: Sunday belongs to last week.
    yesterdaySpentCents: summary.buckets[addCalendarDays(dateKey, -1)]?.totalCents ?? 0,
  };
}

export type TransactionCursor = { transactionDate: string; createdAt: string; id: number };
export type TransactionPage = { items: Transaction[]; nextCursor: TransactionCursor | null };

export async function getTransactionsPage(db: Reader, range: DateRange, cursor: TransactionCursor | null = null, pageSize = 50): Promise<TransactionPage> {
  validateRange(range);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) throw new Error("Page size must be between 1 and 200.");
  const params: Array<string | number> = [range.startKey, range.endExclusiveKey];
  const after = cursor ? "AND (transaction_date, created_at, id) < (?, ?, ?)" : "";
  if (cursor) params.push(cursor.transactionDate, cursor.createdAt, cursor.id);
  params.push(pageSize + 1);
  const rows = await db.getAllAsync<{
    id: number; amount_cents: number; category: string; note: string;
    need_want: "Need" | "Want"; transaction_date: string; created_at: string;
  }>(`SELECT id, amount_cents, category, note, need_want, transaction_date, created_at
    FROM transactions WHERE transaction_date >= ? AND transaction_date < ? ${after}
    ORDER BY transaction_date DESC, created_at DESC, id DESC LIMIT ?`, ...params);
  const items: Transaction[] = rows.slice(0, pageSize).map((row) => ({
    id: row.id, amountCents: row.amount_cents, category: row.category, note: row.note,
    needWant: row.need_want, transactionDate: row.transaction_date, createdAt: row.created_at,
  }));
  const last = items.at(-1);
  return { items, nextCursor: rows.length > pageSize && last ? { transactionDate: last.transactionDate, createdAt: last.createdAt, id: last.id } : null };
}
