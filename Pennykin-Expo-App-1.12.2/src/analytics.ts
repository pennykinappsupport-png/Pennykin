import { addDays, startOfMonth, startOfYear } from "date-fns";
import { calendarDayDifference, parseDateKey, todayKey, weekStartKey } from "./date";
import type { SpendingSummary } from "./transactionQueries";

export type AnalyticsPeriod = "day" | "week" | "month" | "year";

export type SpendingBucket = {
  key: string;
  label: string;
  amountCents: number;
  cumulativeCents: number;
};

export type SpendingCategory = {
  category: string;
  amountCents: number;
  percent: number;
};

export type SpendingAnalytics = {
  period: AnalyticsPeriod;
  periodTitle: string;
  startKey: string;
  endKey: string;
  entryCount: number;
  buckets: SpendingBucket[];
  categories: SpendingCategory[];
  totalCents: number;
  averageCents: number;
  averageLabel: string;
  needsCents: number;
  wantsCents: number;
};

export type SpendingComparison = {
  direction: "lower" | "higher" | "same" | "new" | "none";
  percent: number | null;
};

function cloneDay(date: Date) { return parseDateKey(todayKey(date)); }
function dateKey(date: Date) { return todayKey(date); }
function dayDistance(from: Date, to: Date) { return calendarDayDifference(todayKey(from), todayKey(to)); }
function mondayOf(date: Date) { return parseDateKey(weekStartKey(date)); }

export function getPeriodOffsetForDate(period: AnalyticsPeriod, selectedDate: Date, now = new Date()) {
  const selected = cloneDay(selectedDate);
  const current = cloneDay(now);
  if (period === "day") return dayDistance(current, selected);
  if (period === "week") return Math.trunc(dayDistance(mondayOf(current), mondayOf(selected)) / 7);
  if (period === "month") return (selected.getFullYear() - current.getFullYear()) * 12 + selected.getMonth() - current.getMonth();
  return selected.getFullYear() - current.getFullYear();
}

export function periodWindow(period: AnalyticsPeriod, offset: number, now: Date) {
  const today = cloneDay(now);
  if (period === "day") {
    const start = addDays(today, offset);
    return { start, end: start };
  }
  if (period === "week") {
    const start = addDays(mondayOf(today), offset * 7);
    return { start, end: addDays(start, 6) };
  }
  if (period === "month") {
    const start = startOfMonth(new Date(today.getFullYear(), today.getMonth() + offset, 1));
    return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 0) };
  }
  const start = startOfYear(new Date(today.getFullYear() + offset, 0, 1));
  return { start, end: new Date(start.getFullYear(), 11, 31) };
}

function periodTitle(period: AnalyticsPeriod, offset: number, start: Date, end: Date) {
  if (period === "day") {
    const prefix = offset === 0 ? "Today · " : offset === -1 ? "Yesterday · " : "";
    return `${prefix}${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  if (period === "month") return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  if (period === "year") return String(start.getFullYear());
  const left = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const right = end.toLocaleDateString("en-US", {
    month: start.getMonth() === end.getMonth() ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${left}–${right}`;
}

function makeBuckets(period: AnalyticsPeriod, start: Date, end: Date) {
  if (period === "day") {
    return Array.from({ length: 6 }, (_, index) => ({ key: String(index), label: ["12a", "4a", "8a", "12p", "4p", "8p"][index] ?? "", amountCents: 0 }));
  }
  if (period === "week") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      return { key: dateKey(date), label: date.toLocaleDateString("en-US", { weekday: "short" }), amountCents: 0 };
    });
  }
  if (period === "month") {
    const count = Math.ceil(end.getDate() / 7);
    return Array.from({ length: count }, (_, index) => {
      const first = index * 7 + 1;
      const last = Math.min(end.getDate(), first + 6);
      return { key: String(index), label: `${first}–${last}`, amountCents: 0 };
    });
  }
  return Array.from({ length: 12 }, (_, index) => ({
    key: String(index),
    label: new Date(start.getFullYear(), index, 1).toLocaleDateString("en-US", { month: "short" }).slice(0, 1),
    amountCents: 0,
  }));
}

function elapsedAverageDivisor(period: AnalyticsPeriod, offset: number, start: Date, end: Date, now: Date, transactionCount: number) {
  if (period === "day") return { divisor: Math.max(1, transactionCount), label: "per entry" };
  if (period === "year") {
    const divisor = offset === 0 ? now.getMonth() + 1 : 12;
    return { divisor, label: "per month" };
  }
  const fullDays = dayDistance(start, end) + 1;
  const divisor = offset === 0 ? Math.min(fullDays, Math.max(1, dayDistance(start, cloneDay(now)) + 1)) : fullDays;
  return { divisor, label: "per day" };
}

// SQL owns all record-level aggregation. This function only presents the small
// aggregate result (including empty buckets) and applies calendar-based divisors.
export function buildSpendingAnalytics(
  summary: SpendingSummary,
  period: AnalyticsPeriod,
  offset = 0,
  now = new Date(),
): SpendingAnalytics {
  const { start, end } = periodWindow(period, offset, now);
  let cumulativeCents = 0;
  const buckets = makeBuckets(period, start, end).map((bucket) => {
    const amountCents = summary.buckets[bucket.key]?.totalCents ?? 0;
    cumulativeCents += amountCents;
    return { ...bucket, amountCents, cumulativeCents };
  });
  const categories = summary.categories.map((item) => ({
    category: item.key,
    amountCents: item.totalCents,
    percent: summary.totalCents === 0 ? 0 : Math.round(item.totalCents / summary.totalCents * 100),
  }));
  const average = elapsedAverageDivisor(period, offset, start, end, now, summary.entryCount);
  return {
    period, periodTitle: periodTitle(period, offset, start, end),
    startKey: dateKey(start), endKey: dateKey(end), entryCount: summary.entryCount,
    buckets, categories, totalCents: summary.totalCents,
    needsCents: summary.needsCents, wantsCents: summary.totalCents - summary.needsCents,
    averageCents: Math.round(summary.totalCents / average.divisor), averageLabel: average.label,
  };
}

export function compareSpending(currentCents: number, previousCents: number): SpendingComparison {
  if (previousCents === 0) {
    return currentCents === 0
      ? { direction: "none", percent: null }
      : { direction: "new", percent: null };
  }
  const change = currentCents - previousCents;
  if (change === 0) return { direction: "same", percent: 0 };
  return {
    direction: change < 0 ? "lower" : "higher",
    percent: Math.round((Math.abs(change) / previousCents) * 100),
  };
}
