import { daysBetween, parseDateKey, todayKey, weekStartKey } from "./date";
import type { Snapshot } from "./types";

export const BUDGET_CATEGORIES = ["Food", "Transport", "School", "Entertainment", "Shopping", "Other"] as const;

export type BudgetCategoryRow = {
  category: string;
  plannedCents: number;
  actualCents: number;
  varianceCents: number;
  remainingCents: number;
};

export type OpportunityCost = {
  safeDaysEquivalent: number | null;
  weeklyRemainingSharePercent: number | null;
  goalName: string | null;
  goalGapSharePercent: number | null;
};

export function getBudgetMetrics(snapshot: Snapshot, now = parseDateKey(snapshot.financialActuals.dateKey)) {
  const weekStart = weekStartKey(now);
  const actuals = snapshot.financialActuals;
  const totalSpentCents = actuals.totalCents;
  const needsSpentCents = actuals.needsCents;
  const wantsSpentCents = totalSpentCents - needsSpentCents;
  const actualByCategory = actuals.categorySpentCents;
  const plannedByCategory = snapshot.categoryBudgets.reduce<Record<string, number>>((totals, item) => {
    totals[item.category] = item.plannedCents;
    return totals;
  }, {});
  const categoryRows: BudgetCategoryRow[] = BUDGET_CATEGORIES.map((category) => {
    const plannedCents = plannedByCategory[category] ?? 0;
    const actualCents = actualByCategory[category] ?? 0;
    return {
      category,
      plannedCents,
      actualCents,
      varianceCents: actualCents - plannedCents,
      remainingCents: plannedCents - actualCents,
    };
  });
  const plannedTotalCents = categoryRows.reduce((sum, row) => sum + row.plannedCents, 0);
  const unallocatedCents = Math.max(0, snapshot.settings.weeklyBudgetCents - plannedTotalCents);
  const remainingBudgetCents = snapshot.settings.weeklyBudgetCents - totalSpentCents;
  const reservedCents = snapshot.reservedExpenses.reduce((sum, item) => sum + item.amountCents, 0);
  const elapsedDays = Math.min(7, daysBetween(weekStart, todayKey(now)) + 1);
  const remainingDays = Math.max(1, 8 - elapsedDays);
  const flexibleRemainingCents = Math.max(0, remainingBudgetCents - reservedCents);
  const safeTodayCents = Math.floor(flexibleRemainingCents / remainingDays);
  const forecastCents = totalSpentCents === 0 ? 0 : Math.round(totalSpentCents / elapsedDays * 7);
  const forecastReady = elapsedDays >= 2 || actuals.entryCount >= 3;
  const baselineDailyCents = Math.round(snapshot.settings.weeklyBudgetCents / 7);
  const averageDailySpendCents = Math.round(totalSpentCents / elapsedDays);
  const paceRatio = baselineDailyCents > 0 ? averageDailySpendCents / baselineDailyCents : 0;
  const committedCents = Math.min(snapshot.settings.weeklyBudgetCents, needsSpentCents + reservedCents);
  const flexibleBudgetCents = Math.max(0, snapshot.settings.weeklyBudgetCents - needsSpentCents - reservedCents);
  const flexibilityScore = snapshot.settings.weeklyBudgetCents > 0
    ? Math.round((flexibleBudgetCents / snapshot.settings.weeklyBudgetCents) * 100)
    : 0;
  const yesterdaySpentCents = actuals.yesterdaySpentCents;
  const forwardResetActive = elapsedDays > 1 && yesterdaySpentCents >= baselineDailyCents * 1.25;
  const goalGapCents = snapshot.savingsGoal
    ? Math.max(0, snapshot.savingsGoal.targetCents - snapshot.savingsGoal.savedCents)
    : 0;
  const wantsSafeDaysEquivalent = safeTodayCents > 0 ? wantsSpentCents / safeTodayCents : null;
  const wantsGoalGapSharePercent = goalGapCents > 0 ? (wantsSpentCents / goalGapCents) * 100 : null;

  return {
    transactionCount: actuals.entryCount,
    categoryRows,
    totalSpentCents,
    needsSpentCents,
    wantsSpentCents,
    plannedTotalCents,
    unallocatedCents,
    remainingBudgetCents,
    reservedCents,
    flexibleRemainingCents,
    safeTodayCents,
    elapsedDays,
    remainingDays,
    forecastCents,
    forecastReady,
    baselineDailyCents,
    averageDailySpendCents,
    paceRatio,
    committedCents,
    flexibleBudgetCents,
    flexibilityScore,
    yesterdaySpentCents,
    forwardResetActive,
    wantsSafeDaysEquivalent,
    wantsGoalGapSharePercent,
    totalVarianceCents: totalSpentCents - snapshot.settings.weeklyBudgetCents,
  };
}

export function getOpportunityCost(snapshot: Snapshot, amountCents: number): OpportunityCost {
  const metrics = getBudgetMetrics(snapshot);
  const remainingGoalCents = snapshot.savingsGoal
    ? Math.max(0, snapshot.savingsGoal.targetCents - snapshot.savingsGoal.savedCents)
    : 0;
  return {
    safeDaysEquivalent: metrics.safeTodayCents > 0 ? amountCents / metrics.safeTodayCents : null,
    weeklyRemainingSharePercent: metrics.remainingBudgetCents > 0
      ? (amountCents / metrics.remainingBudgetCents) * 100
      : null,
    goalName: snapshot.savingsGoal?.title ?? null,
    goalGapSharePercent: remainingGoalCents > 0 ? (amountCents / remainingGoalCents) * 100 : null,
  };
}
