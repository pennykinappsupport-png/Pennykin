import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfWeek } from "date-fns";

// A DateKey is a civil date, not an instant. Never parse it with new Date(key),
// which interprets bare ISO dates as UTC and can move them to the previous day.
export function parseDateKey(key: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error(`Invalid calendar date: ${key}`);
  const date = parseISO(key);
  if (!isValid(date) || format(date, "yyyy-MM-dd") !== key) throw new Error(`Invalid calendar date: ${key}`);
  return date;
}

export function todayKey(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function addCalendarDays(key: string, amount: number): string {
  return todayKey(addDays(parseDateKey(key), amount));
}

export function weekStartKey(date = new Date()): string {
  return todayKey(startOfWeek(date, { weekStartsOn: 1 }));
}

// Signed for period navigation. Business elapsed-day callers retain the
// nonnegative daysBetween contract explicitly below.
export function calendarDayDifference(fromKey: string, toKey: string): number {
  return differenceInCalendarDays(parseDateKey(toKey), parseDateKey(fromKey));
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.max(0, calendarDayDifference(fromKey, toKey));
}

// Refresh even if a timezone change leaves the civil date unchanged: the day
// chart groups UTC creation instants into the device's current local hours.
export function calendarContextKey(date = new Date()): string {
  return `${todayKey(date)}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${date.getTimezoneOffset()}`;
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
