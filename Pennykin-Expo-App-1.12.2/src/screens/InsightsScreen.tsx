import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";

import { useSpendingReports } from "../useFinancialQueries";
import { useApp } from "../AppContext";
import { compareSpending, getPeriodOffsetForDate, type AnalyticsPeriod } from "../analytics";
import { APP_NAME, APP_VERSION, BETA_LENGTH_DAYS } from "../brand";
import { BUDGET_CATEGORIES, getBudgetMetrics } from "../budget";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CategoryDonutChart, CategoryRanking, ChartLegend, SpendingTrendChart } from "../components/SpendingCharts";
import { PrivacySupportLinks } from "../components/PrivacySupportLinks";
import { SUPPORT_EMAIL } from "../support";
import { PetAvatar } from "../components/PetAvatar";
import { Screen } from "../components/Screen";
import { addCalendarDays, daysBetween, formatMoney, parseDateKey, todayKey } from "../date";
import { AppText as Text, AppTextInput as TextInput } from "../display";
import { colors, spacing } from "../theme";
import type { CategoryBudget, PetType, ThemeMode } from "../types";

const petTypes: PetType[] = ["cat", "dog", "rabbit"];
const periodOptions: Array<{ key: AnalyticsPeriod; label: string }> = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

function moneyToCents(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole = "0", decimal = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

export function InsightsScreen() {
  const {
    snapshot, updateProfile, saveSavingsGoal, saveBudgetPlan,
    addReservedExpense, deleteReservedExpense, resetAllData, updateAppearance,
  } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [planningExpanded, setPlanningExpanded] = useState(false);
  const [plannerEditing, setPlannerEditing] = useState(false);
  const [goalEditing, setGoalEditing] = useState(!snapshot?.savingsGoal);
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 12);
  });
  const [name, setName] = useState(snapshot?.settings.petName ?? "");
  const [petType, setPetType] = useState<PetType>(snapshot?.settings.petType ?? "cat");
  const [budget, setBudget] = useState(snapshot ? (snapshot.settings.weeklyBudgetCents / 100).toFixed(2) : "50.00");
  const [planValues, setPlanValues] = useState<Record<string, string>>(() => Object.fromEntries(
    BUDGET_CATEGORIES.map((category) => [category, ((snapshot?.categoryBudgets.find((item) => item.category === category)?.plannedCents ?? 0) / 100).toFixed(2)]),
  ));
  const [reservedTitle, setReservedTitle] = useState("");
  const [reservedAmount, setReservedAmount] = useState("");
  const [goalTitle, setGoalTitle] = useState(snapshot?.savingsGoal?.title ?? "");
  const [goalTarget, setGoalTarget] = useState(snapshot?.savingsGoal ? (snapshot.savingsGoal.targetCents / 100).toFixed(2) : "");
  const [goalSaved, setGoalSaved] = useState(snapshot?.savingsGoal ? (snapshot.savingsGoal.savedCents / 100).toFixed(2) : "0.00");
  const [experience, setExperience] = useState("4");
  const [paymentInterest, setPaymentInterest] = useState("Maybe");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const metrics = useMemo(() => snapshot ? getBudgetMetrics(snapshot) : null, [snapshot]);
  const reports = useSpendingReports(snapshot, period, periodOffset);
  const analytics = reports.current;
  const previousAnalytics = reports.previous;
  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1, 12);
    const firstVisibleKey = addCalendarDays(todayKey(firstOfMonth), -firstOfMonth.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const key = addCalendarDays(firstVisibleKey, index);
      const date = parseDateKey(key);
      return { date, key, inMonth: date.getMonth() === calendarMonth.getMonth() };
    });
  }, [calendarMonth]);
  if (!snapshot || !metrics) return null;
  if (!analytics || !previousAnalytics) return <Screen title="Insights" subtitle="See where your money went—at a glance."><Card><Text style={styles.body}>{reports.error ?? "Loading spending…"}</Text>{reports.error ? <Button label="Retry" onPress={reports.retry} /> : null}</Card></Screen>;

  const goal = snapshot.savingsGoal;
  const goalPercent = goal ? Math.min(100, Math.round((goal.savedCents / goal.targetCents) * 100)) : 0;
  const betaDay = Math.min(BETA_LENGTH_DAYS, daysBetween(snapshot.settings.firstOpenDate, snapshot.financialActuals.dateKey) + 1);
  const betaCheckins = snapshot.checkins.filter((item) => item.checkinDate >= snapshot.settings.firstOpenDate).length;
  const needsPercent = analytics.totalCents === 0 ? 0 : Math.round((analytics.needsCents / analytics.totalCents) * 100);
  const wantsPercent = analytics.totalCents === 0 ? 0 : 100 - needsPercent;
  const leadingCategory = analytics.categories[0];
  const insightCopy = leadingCategory
    ? `${leadingCategory.category} is your largest category at ${leadingCategory.percent}% for this period.`
    : "Complete a money check-in to begin your spending story.";
  const showSafeToday = periodOffset === 0 && (period === "day" || period === "week");
  const comparison = compareSpending(analytics.totalCents, previousAnalytics.totalCents);
  const comparisonValue = comparison.direction === "none" ? "—"
    : comparison.direction === "new" ? "NEW"
    : comparison.direction === "same" ? "NO CHANGE"
    : `${comparison.percent}% ${comparison.direction.toUpperCase()}`;
  const comparisonMeta = comparison.direction === "none" ? `No spending in previous ${period}`
    : comparison.direction === "new" ? `No spending in previous ${period}`
    : comparison.direction === "same" ? `Same as previous ${period}`
    : `than previous ${period}`;

  const choosePeriod = (nextPeriod: AnalyticsPeriod) => {
    setPeriod(nextPeriod);
    setPeriodOffset(0);
  };

  const openCalendar = () => {
    const focusDate = new Date(`${analytics.startKey}T12:00:00`);
    setCalendarMonth(new Date(focusDate.getFullYear(), focusDate.getMonth(), 1, 12));
    setShowCalendar(true);
  };

  const selectCalendarDate = (date: Date) => {
    setPeriodOffset(getPeriodOffsetForDate(period, date));
    setShowCalendar(false);
  };

  const savePlanner = async () => {
    const weeklyBudgetCents = moneyToCents(budget);
    if (weeklyBudgetCents === null || weeklyBudgetCents <= 0) {
      Alert.alert("Check the budget", "Enter a positive weekly budget with up to two decimal places."); return;
    }
    const plans: CategoryBudget[] = [];
    for (const category of BUDGET_CATEGORIES) {
      const plannedCents = moneyToCents(planValues[category] || "0");
      if (plannedCents === null) { Alert.alert("Check the plan", `${category} needs a valid amount.`); return; }
      plans.push({ category, plannedCents });
    }
    const allocated = plans.reduce((sum, item) => sum + item.plannedCents, 0);
    if (allocated > weeklyBudgetCents) {
      Alert.alert("Plan is over the total", `Categories add up to ${formatMoney(allocated)}, above the ${formatMoney(weeklyBudgetCents)} total.`); return;
    }
    try { setBusy(true); await saveBudgetPlan(weeklyBudgetCents, plans); setPlannerEditing(false); }
    catch (error) { Alert.alert("Could not save", error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const addReserve = async () => {
    const amountCents = moneyToCents(reservedAmount);
    if (!reservedTitle.trim() || amountCents === null || amountCents <= 0) {
      Alert.alert("Check the expense", "Add a short name and a positive amount."); return;
    }
    try { setBusy(true); await addReservedExpense({ title: reservedTitle, amountCents }); setReservedTitle(""); setReservedAmount(""); }
    catch (error) { Alert.alert("Could not add", error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const saveProfile = async () => {
    const weeklyBudgetCents = moneyToCents(budget);
    if (weeklyBudgetCents === null || weeklyBudgetCents <= 0) { Alert.alert("Check the budget", "Enter a positive amount."); return; }
    try { setBusy(true); await updateProfile({ petName: name, petType, weeklyBudgetCents }); setProfileEditing(false); }
    catch (error) { Alert.alert("Could not save", error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const saveGoal = async () => {
    const targetCents = moneyToCents(goalTarget); const savedCents = moneyToCents(goalSaved);
    if (!goalTitle.trim() || targetCents === null || targetCents <= 0 || savedCents === null) { Alert.alert("Check the goal", "Add a name and valid dollar amounts."); return; }
    try { setBusy(true); await saveSavingsGoal({ title: goalTitle, targetCents, savedCents }); setGoalEditing(false); }
    catch (error) { Alert.alert("Could not save", error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const shareFeedback = async () => {
    const message = [
      `${APP_NAME} 14-day beta feedback`, `Beta day: ${betaDay}/${BETA_LENGTH_DAYS}`,
      `Days checked in: ${betaCheckins}`, `Current streak: ${snapshot.settings.checkinStreak}`,
      `Experience rating: ${experience}/5`, `Would pay $14.99–$19.99 once: ${paymentInterest}`,
      `Notes: ${feedback.trim() || "No notes added"}`, "", "Automatic fields exclude transaction amounts and descriptions. Check your own notes before sending.",
      `To contact the developer, send this to ${SUPPORT_EMAIL}.`,
    ].join("\n");
    try { await Share.share({ message, title: `${APP_NAME} beta feedback` }); }
    catch { Alert.alert("Could not share", "Please try again from your device."); }
  };

  const changeAppearance = async (themeMode: ThemeMode, largeText: boolean) => {
    try { setBusy(true); await updateAppearance(themeMode, largeText); }
    catch (error) { Alert.alert("Could not update appearance", error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const confirmReset = () => Alert.alert("Delete all local data?", "This permanently removes expenses, budget plans, reserved expenses, pet progress, shop items, and savings from this device.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete everything", style: "destructive", onPress: () => { setBusy(true); resetAllData().catch((error: unknown) => Alert.alert("Could not reset", error instanceof Error ? error.message : "Something went wrong.")).finally(() => setBusy(false)); } },
  ]);

  if (showSettings) {
    return (
      <Screen title="Settings" subtitle="Beta tools, upgrade plans, and local-data controls.">
        <Pressable onPress={() => setShowSettings(false)} style={styles.backButton}><Text style={styles.backText}>‹ Back to Insights</Text></Pressable>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card style={styles.stack}>
          <Text style={styles.cardTitle}>Color mode</Text>
          <Text style={styles.helper}>Choose a mode manually, or let System follow your iPhone appearance.</Text>
          <View style={styles.appearanceOptions}>
            {(["system", "light", "dark"] as ThemeMode[]).map((mode) => {
              const selected = snapshot.settings.themeMode === mode;
              return <Pressable accessibilityRole="button" accessibilityState={{ selected }} disabled={busy} key={mode} onPress={() => changeAppearance(mode, snapshot.settings.largeText)} style={[styles.appearanceOption, selected && styles.appearanceOptionSelected]}><Text style={[styles.appearanceOptionText, selected && styles.appearanceOptionTextSelected]}>{mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}</Text></Pressable>;
            })}
          </View>
          <View style={styles.divider} />
          <Text style={styles.cardTitle}>Text size</Text>
          <Text style={styles.helper}>Large increases Pennykin text by 18% and still respects iOS Dynamic Type.</Text>
          <View style={styles.appearanceOptions}>
            {[{ label: "Standard", value: false }, { label: "Large", value: true }].map((option) => {
              const selected = snapshot.settings.largeText === option.value;
              return <Pressable accessibilityRole="button" accessibilityState={{ selected }} disabled={busy} key={option.label} onPress={() => changeAppearance(snapshot.settings.themeMode, option.value)} style={[styles.appearanceOption, selected && styles.appearanceOptionSelected]}><Text style={[styles.appearanceOptionText, selected && styles.appearanceOptionTextSelected]}>{option.label}</Text></Pressable>;
            })}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Beta feedback</Text>
        <Card style={styles.stack}>
          <View style={styles.rowBetween}><Text style={styles.cardTitle}>Day {betaDay} of {BETA_LENGTH_DAYS}</Text><Text style={styles.purpleMeta}>{betaCheckins} check-ins</Text></View>
          <Text style={styles.inputLabel}>Overall experience</Text><View style={styles.chips}>{["1", "2", "3", "4", "5"].map((value) => <Pressable key={value} onPress={() => setExperience(value)} style={[styles.ratingChip, experience === value && styles.chipSelected]}><Text style={[styles.chipText, experience === value && styles.chipTextSelected]}>{value}</Text></Pressable>)}</View>
          <Text style={styles.inputLabel}>Would you pay $14.99–$19.99 once?</Text><View style={styles.chips}>{["Yes", "Maybe", "No"].map((value) => <Pressable key={value} onPress={() => setPaymentInterest(value)} style={[styles.optionChip, paymentInterest === value && styles.chipSelected]}><Text style={[styles.chipText, paymentInterest === value && styles.chipTextSelected]}>{value}</Text></Pressable>)}</View>
          <TextInput maxLength={500} multiline numberOfLines={4} onChangeText={setFeedback} placeholder="What felt easy, confusing, or worth returning for?" placeholderTextColor="#AAA3B2" style={[styles.input, styles.feedbackInput]} textAlignVertical="top" value={feedback} />
          <Button label="Share beta summary" onPress={shareFeedback} /><Text style={styles.helper}>You choose the recipient. Automatic fields exclude transaction amounts and descriptions; keep private details out of your notes.</Text>
        </Card>

        <Text style={styles.sectionTitle}>Privacy & support</Text>
        <Card style={styles.stack}><Text style={styles.helper}>Read the full policy and help offline, or contact the developer.</Text><PrivacySupportLinks /></Card>

        <Text style={styles.sectionTitle}>Founders Pro plan</Text>
        <Card style={styles.proCard}><Text style={styles.cardTitle}>One-time unlock, after beta validation</Text><Text style={styles.body}>Planned: advanced trends, unlimited goals, custom categories, premium rooms, CSV export, and manual backup. No subscription is active in this beta.</Text></Card>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Profile & privacy</Text><Pressable onPress={() => setProfileEditing((value) => !value)}><Text style={styles.edit}>{profileEditing ? "Cancel" : "Edit"}</Text></Pressable></View>
        <Card style={styles.stack}>
          {profileEditing ? <>
            <Text style={styles.inputLabel}>Pet name</Text><TextInput maxLength={20} onChangeText={setName} style={styles.input} value={name} />
            <Text style={styles.inputLabel}>Choose a pet</Text><View style={styles.petTypes}>{petTypes.map((type) => <Pressable key={type} accessibilityRole="button" accessibilityLabel={`Choose ${type}`} accessibilityState={{ selected: petType === type }} onPress={() => setPetType(type)} style={[styles.petChoice, petType === type && styles.petChoiceSelected]}><View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><PetAvatar size={68} type={type} /></View></Pressable>)}</View>
            <Text style={styles.inputLabel}>Weekly budget ($)</Text><TextInput keyboardType="decimal-pad" onChangeText={setBudget} style={styles.input} value={budget} /><Button disabled={busy} label="Save settings" onPress={saveProfile} />
          </> : <View style={styles.petSummary}><PetAvatar size={58} type={snapshot.settings.petType} /><View><Text style={styles.settingValue}>{snapshot.settings.petName}</Text><Text style={styles.helper}>Weekly budget: {formatMoney(snapshot.settings.weeklyBudgetCents)}</Text></View></View>}
          <View style={styles.divider} /><Text style={styles.cardTitle}>Local by design</Text><Text style={styles.body}>Money records, category plans, and reserved expenses stay in this device’s SQLite database. There is no login, bank connection, advertising, third-party analytics SDK, or developer-operated cloud sync. Apple may separately provide TestFlight testing diagnostics; see the full policy.</Text><Text style={styles.body}>Educational and habit-building purposes only; not financial advice.</Text><Text style={styles.buildLabel}>{APP_NAME} {APP_VERSION} · Simple Insights build</Text><Button disabled={busy} label="Delete all local data" onPress={confirmReset} variant="danger" />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Insights" subtitle="See where your money went—at a glance.">
      <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}><Text style={styles.settingsButtonText}>⚙ Settings</Text></Pressable>

      <View accessibilityRole="tablist" style={styles.periodTabs}>
        {periodOptions.map((option) => {
          const selected = period === option.key;
          return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={option.key} onPress={() => choosePeriod(option.key)} style={[styles.periodTab, selected && styles.periodTabSelected]}><Text style={[styles.periodTabText, selected && styles.periodTabTextSelected]}>{option.label}</Text></Pressable>;
        })}
      </View>

      <Card style={styles.periodCard}>
        <Pressable accessibilityLabel="Previous period" onPress={() => setPeriodOffset((value) => value - 1)} style={styles.periodArrow}><Text style={styles.periodArrowText}>‹</Text></Pressable>
        <Pressable accessibilityHint="Opens a calendar. Tap any date to jump directly to the matching period." accessibilityLabel={`Selected ${period}: ${analytics.periodTitle}. Tap to open calendar.`} accessibilityRole="button" onPress={openCalendar} style={({ pressed }) => [styles.periodTitleButton, pressed && styles.periodTitleButtonPressed]}><Text numberOfLines={1} style={styles.periodTitle}>{analytics.periodTitle}</Text><Text style={styles.periodTitleChevron}>⌄</Text></Pressable>
        <Pressable accessibilityLabel="Next period" accessibilityState={{ disabled: periodOffset === 0 }} disabled={periodOffset === 0} onPress={() => setPeriodOffset((value) => Math.min(0, value + 1))} style={[styles.periodArrow, periodOffset === 0 && styles.periodArrowDisabled]}><Text style={styles.periodArrowText}>›</Text></Pressable>
      </Card>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryMain}><Text style={styles.summaryLabel}>TOTAL SPENT</Text><Text style={styles.summaryValue}>{formatMoney(analytics.totalCents)}</Text><Text style={styles.summaryMeta}>{analytics.entryCount} {analytics.entryCount === 1 ? "entry" : "entries"}</Text></View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryMetric}><Text style={styles.summaryLabel}>AVERAGE</Text><Text style={styles.summarySmallValue}>{formatMoney(analytics.averageCents)}</Text><Text style={styles.summaryMeta}>{analytics.averageLabel}</Text></View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryMetric}>{showSafeToday ? <><Text style={styles.summaryLabel}>SAFE TODAY</Text><Text style={styles.summarySmallValue}>{formatMoney(metrics.safeTodayCents)}</Text><Text style={styles.summaryMeta}>{metrics.remainingDays}d left</Text></> : <><Text style={styles.summaryLabel}>VS PREVIOUS</Text><Text style={styles.summarySmallValue}>{comparisonValue}</Text><Text style={styles.summaryMeta}>{comparisonMeta}</Text></>}</View>
      </Card>

      <Card style={styles.chartCard}>
        <View style={styles.cardHeading}><View><Text style={styles.cardTitle}>Spending trend</Text><Text style={styles.helper}>Bars show each period; the line shows your running total.</Text></View></View>
        <SpendingTrendChart buckets={analytics.buckets} />
        <ChartLegend />
      </Card>

      <Card style={styles.chartCard}>
        <View style={styles.cardHeading}><View><Text style={styles.cardTitle}>Categories</Text><Text style={styles.helper}>Where your money went in this period.</Text></View></View>
        <View style={styles.donutRow}>
          <CategoryDonutChart categories={analytics.categories} totalCents={analytics.totalCents} />
          <View style={styles.mixSummary}>
            <Text style={styles.mixTitle}>NEED / WANT</Text>
            <View style={styles.mixBar}>{analytics.totalCents > 0 ? <><View style={[styles.needFill, { width: `${needsPercent}%` }]} /><View style={[styles.wantFill, { width: `${wantsPercent}%` }]} /></> : null}</View>
            <View style={styles.mixLine}><View style={[styles.mixDot, styles.needDot]} /><Text style={styles.mixText}>Needs</Text><Text style={styles.mixNumber}>{needsPercent}%</Text></View>
            <View style={styles.mixLine}><View style={[styles.mixDot, styles.wantDot]} /><Text style={styles.mixText}>Wants</Text><Text style={styles.mixNumber}>{wantsPercent}%</Text></View>
          </View>
        </View>
        <CategoryRanking categories={analytics.categories} />
      </Card>

      <View style={styles.insightStrip}><Text style={styles.insightEmoji}>✦</Text><Text style={styles.insightText}>{insightCopy}</Text></View>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: planningExpanded }} onPress={() => setPlanningExpanded((value) => !value)} style={({ pressed }) => [styles.planningButton, pressed && styles.pressed]}>
        <View><Text style={styles.planningTitle}>Planning tools</Text><Text style={styles.planningSubtitle}>Budget, reserves, savings goal, and achievements</Text></View><Text style={styles.planningChevron}>{planningExpanded ? "⌃" : "⌄"}</Text>
      </Pressable>

      {planningExpanded ? <>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Weekly Budget Planner</Text><Pressable onPress={() => setPlannerEditing((value) => !value)}><Text style={styles.edit}>{plannerEditing ? "Cancel" : "Edit plan"}</Text></Pressable></View>
        <Card style={styles.stack}>
          {plannerEditing ? <>
            <Text style={styles.inputLabel}>Weekly total ($)</Text><TextInput keyboardType="decimal-pad" onChangeText={setBudget} style={styles.input} value={budget} />
            <View style={styles.planFields}>{BUDGET_CATEGORIES.map((category) => <View key={category} style={styles.planField}><Text style={styles.planLabel}>{category}</Text><View style={styles.moneyField}><Text style={styles.dollar}>$</Text><TextInput keyboardType="decimal-pad" onChangeText={(value) => setPlanValues((current) => ({ ...current, [category]: value }))} style={styles.planInput} value={planValues[category]} /></View></View>)}</View>
            <Text style={styles.helper}>Category plans may leave money unallocated, but cannot exceed the weekly total.</Text><Button disabled={busy} label="Save weekly plan" onPress={savePlanner} />
          </> : <>
            <View style={styles.budgetSummary}><View><Text style={styles.summaryLabel}>WEEKLY PLAN</Text><Text style={styles.budgetValue}>{formatMoney(snapshot.settings.weeklyBudgetCents)}</Text></View><View><Text style={[styles.summaryLabel, styles.alignRight]}>LEFT THIS WEEK</Text><Text style={[styles.budgetValue, styles.alignRight]}>{formatMoney(Math.max(0, metrics.remainingBudgetCents))}</Text></View></View>
            {metrics.categoryRows.map((row) => <View key={row.category} style={styles.budgetRow}><Text style={styles.budgetName}>{row.category}</Text><Text style={styles.budgetNumbers}>{formatMoney(row.actualCents)} / {formatMoney(row.plannedCents)}</Text></View>)}
          </>}
        </Card>

        <Text style={styles.sectionTitle}>Reserved expenses</Text>
        <Card style={styles.stack}><Text style={styles.body}>Reserve known future costs so Safe to Spend does not treat that money as flexible.</Text><View style={styles.reserveForm}><TextInput maxLength={40} onChangeText={setReservedTitle} placeholder="Friday bus" placeholderTextColor="#AAA3B2" style={[styles.input, styles.reserveName]} value={reservedTitle} /><TextInput keyboardType="decimal-pad" onChangeText={setReservedAmount} placeholder="$10" placeholderTextColor="#AAA3B2" style={[styles.input, styles.reserveAmount]} value={reservedAmount} /></View><Button disabled={busy} label="Add reserved expense" onPress={addReserve} variant="secondary" />{snapshot.reservedExpenses.length === 0 ? <Text style={styles.empty}>No expenses reserved for this week.</Text> : snapshot.reservedExpenses.map((item) => <View key={item.id} style={styles.reserveRow}><View style={styles.reserveCopy}><Text style={styles.budgetName}>{item.title}</Text><Text style={styles.helper}>{formatMoney(item.amountCents)} reserved</Text></View><Pressable onPress={() => deleteReservedExpense(item.id)}><Text style={styles.remove}>Remove</Text></Pressable></View>)}</Card>

        <Text style={styles.sectionTitle}>Savings goal & achievements</Text>
        {goalEditing ? <Card style={styles.stack}>
          <Text style={styles.inputLabel}>What are you saving for?</Text><TextInput maxLength={40} onChangeText={setGoalTitle} placeholder="e.g. school trip" placeholderTextColor="#AAA3B2" style={styles.input} value={goalTitle} />
          <Text style={styles.inputLabel}>Target amount ($)</Text><TextInput keyboardType="decimal-pad" onChangeText={setGoalTarget} placeholder="300.00" placeholderTextColor="#AAA3B2" style={styles.input} value={goalTarget} />
          <Text style={styles.inputLabel}>Saved so far ($)</Text><TextInput keyboardType="decimal-pad" onChangeText={setGoalSaved} style={styles.input} value={goalSaved} />
          <Button disabled={busy} label="Save goal progress" onPress={saveGoal} />{goal ? <Button label="Cancel" onPress={() => setGoalEditing(false)} variant="secondary" /> : null}
        </Card> : goal ? <Pressable onPress={() => setGoalEditing(true)} style={({ pressed }) => [styles.goalCard, pressed && styles.pressed]}>
          <View style={styles.rowBetween}><View style={styles.goalCopy}><Text style={styles.goalTitle}>🌱 {goal.title}</Text><Text style={styles.goalAmount}>{formatMoney(goal.savedCents)} of {formatMoney(goal.targetCents)}</Text></View><View style={styles.goalPercentPill}><Text style={styles.goalPercentText}>{goalPercent}%</Text></View></View>
          <View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${goalPercent}%` }]} /></View><Text style={styles.goalHint}>Tap to update your progress.</Text>
        </Pressable> : <Card style={styles.stack}><Text style={styles.empty}>Create a savings goal and give your money a destination.</Text><Button label="Create savings goal" onPress={() => setGoalEditing(true)} variant="secondary" /></Card>}
        <Card style={styles.badges}>{snapshot.badges.length === 0 ? <Text style={styles.empty}>Your first achievement is waiting for an honest check-in.</Text> : snapshot.badges.map((badge) => <View key={badge} style={styles.badge}><Text style={styles.badgeText}>🏅 {badge}</Text></View>)}</Card>
      </> : null}

      <Modal animationType="slide" onRequestClose={() => setShowCalendar(false)} transparent visible={showCalendar}>
        <View style={styles.pickerOverlay}>
          <Pressable accessibilityLabel="Close calendar" accessibilityRole="button" onPress={() => setShowCalendar(false)} style={styles.pickerBackdrop} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.calendarHeader}>
              <Pressable accessibilityLabel="Previous calendar month" onPress={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - (period === "year" ? 12 : 1), 1, 12))} style={styles.calendarArrow}><Text style={styles.calendarArrowText}>‹</Text></Pressable>
              <View style={styles.calendarHeading}><Text style={styles.calendarMonthTitle}>{calendarMonth.toLocaleDateString("en-US", { month: "long" })}</Text><Text style={styles.calendarYearTitle}>{calendarMonth.getFullYear()}</Text></View>
              <Pressable accessibilityLabel="Next calendar month" onPress={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + (period === "year" ? 12 : 1), 1, 12))} style={styles.calendarArrow}><Text style={styles.calendarArrowText}>›</Text></Pressable>
            </View>
            <View accessibilityRole="text" style={styles.weekdays}>{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}</View>
            <View style={styles.calendarGrid}>
              {calendarCells.map(({ date, key, inMonth }) => {
                const selected = key === analytics.startKey;
                const inSelectedPeriod = period === "week" && key >= analytics.startKey && key <= analytics.endKey;
                return <Pressable accessibilityLabel={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} accessibilityRole="button" accessibilityState={{ selected }} key={key} onPress={() => selectCalendarDate(date)} style={({ pressed }) => [styles.calendarDay, inSelectedPeriod && styles.calendarDayInPeriod, selected && styles.calendarDaySelected, pressed && styles.calendarDayPressed]}><Text style={[styles.calendarDayText, !inMonth && styles.calendarAdjacentText, inSelectedPeriod && styles.calendarInPeriodText, selected && styles.calendarSelectedText]}>{date.getDate()}</Text></Pressable>;
              })}
            </View>
            <View style={styles.calendarFooter}><Text style={styles.calendarHint}>{period === "day" ? "Tap a date to view that day" : period === "week" ? "Tap any date to view its week" : period === "month" ? "Tap any date to view its month" : "Tap any date to view its year"}</Text><Pressable accessibilityRole="button" onPress={() => { setPeriodOffset(0); setShowCalendar(false); }} style={styles.todayButton}><Text style={styles.todayButtonText}>Today</Text></Pressable></View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  settingsButton: { alignSelf: "flex-end", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, marginTop: -62, paddingHorizontal: 13, paddingVertical: 9 },
  settingsButtonText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  backButton: { alignSelf: "flex-start", backgroundColor: colors.primarySoft, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 9 },
  backText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  periodTabs: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, flexDirection: "row", padding: 4 },
  periodTab: { alignItems: "center", borderRadius: 11, flex: 1, minHeight: 40, justifyContent: "center" },
  periodTabSelected: { backgroundColor: colors.primaryStrong },
  periodTabText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  periodTabTextSelected: { color: colors.onPrimary },
  periodCard: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 7 },
  periodArrow: { alignItems: "center", borderRadius: 99, height: 40, justifyContent: "center", width: 40 },
  periodArrowDisabled: { opacity: 0.25 },
  periodArrowText: { color: colors.primary, fontSize: 30, fontWeight: "500", lineHeight: 32 },
  periodTitleButton: { alignItems: "center", borderRadius: 12, flex: 1, flexDirection: "row", justifyContent: "center", minHeight: 42, paddingHorizontal: 6 },
  periodTitleButtonPressed: { backgroundColor: colors.primarySoft },
  periodTitle: { color: colors.text, flexShrink: 1, fontSize: 15, fontWeight: "900", textAlign: "center" },
  periodTitleChevron: { color: colors.primary, fontSize: 14, fontWeight: "900", marginLeft: 7, marginTop: -3 },
  summaryCard: { alignItems: "stretch", backgroundColor: colors.purpleSoft, borderColor: colors.purpleBorder, flexDirection: "row", padding: 13 },
  summaryMain: { flex: 1.25 },
  summaryMetric: { flex: 1, justifyContent: "center" },
  summaryDivider: { backgroundColor: colors.purpleBorder, marginHorizontal: 9, width: 1 },
  summaryLabel: { color: colors.primary, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  summaryValue: { color: colors.text, fontSize: 26, fontWeight: "900", marginTop: 3 },
  summarySmallValue: { color: colors.text, fontSize: 17, fontWeight: "900", marginTop: 5 },
  summaryMeta: { color: colors.muted, fontSize: 9, fontWeight: "700", marginTop: 2 },
  chartCard: { gap: spacing.sm, padding: 13 },
  cardHeading: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  donutRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  mixSummary: { flex: 1, gap: 7 },
  mixTitle: { color: colors.primary, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  mixBar: { backgroundColor: colors.track, borderRadius: 99, flexDirection: "row", height: 9, overflow: "hidden" },
  needFill: { backgroundColor: colors.primary, height: "100%" },
  wantFill: { backgroundColor: colors.secondary, height: "100%" },
  mixLine: { alignItems: "center", flexDirection: "row", gap: 6 },
  mixDot: { borderRadius: 99, height: 8, width: 8 },
  needDot: { backgroundColor: colors.primary },
  wantDot: { backgroundColor: colors.secondary },
  mixText: { color: colors.muted, flex: 1, fontSize: 11, fontWeight: "700" },
  mixNumber: { color: colors.text, fontSize: 11, fontWeight: "900" },
  insightStrip: { alignItems: "center", backgroundColor: colors.greenSoft, borderRadius: 16, flexDirection: "row", gap: 10, padding: 13 },
  insightEmoji: { color: colors.green, fontSize: 18 },
  insightText: { color: colors.text, flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  planningButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: spacing.md },
  planningTitle: { color: colors.text, fontSize: 15, fontWeight: "900" },
  planningSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  planningChevron: { color: colors.primary, fontSize: 22, fontWeight: "900" },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900" },
  edit: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  stack: { gap: spacing.sm },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  empty: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center" },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: "800", marginTop: 2 },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 15, minHeight: 46, paddingHorizontal: 12 },
  planFields: { gap: spacing.xs },
  planField: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  planLabel: { color: colors.text, flex: 1, fontSize: 13, fontWeight: "700" },
  moneyField: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 10, borderWidth: 1, flexDirection: "row", height: 42, paddingLeft: 9, width: 112 },
  dollar: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  planInput: { color: colors.text, flex: 1, fontSize: 14, paddingHorizontal: 5 },
  budgetSummary: { flexDirection: "row", justifyContent: "space-between" },
  budgetValue: { color: colors.text, fontSize: 20, fontWeight: "900", marginTop: 4 },
  alignRight: { textAlign: "right" },
  budgetRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingTop: 10 },
  budgetName: { color: colors.text, fontSize: 13, fontWeight: "800" },
  budgetNumbers: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  reserveForm: { flexDirection: "row", gap: spacing.xs },
  reserveName: { flex: 1 },
  reserveAmount: { width: 92 },
  reserveRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingTop: spacing.sm },
  reserveCopy: { flex: 1 },
  remove: { color: colors.red, fontSize: 11, fontWeight: "800", padding: 8 },
  rowBetween: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  purpleMeta: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  goalCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  goalCopy: { flex: 1 },
  goalTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  goalAmount: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 3 },
  goalPercentPill: { backgroundColor: colors.greenSoft, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7 },
  goalPercentText: { color: colors.green, fontSize: 13, fontWeight: "900" },
  goalTrack: { backgroundColor: colors.track, borderRadius: 99, height: 10, overflow: "hidden" },
  goalFill: { backgroundColor: colors.green, borderRadius: 99, height: "100%" },
  goalHint: { color: colors.primary, fontSize: 10, fontWeight: "800" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  badge: { backgroundColor: colors.yellowSoft, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 8 },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  chips: { flexDirection: "row", gap: spacing.xs },
  ratingChip: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 10 },
  optionChip: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 10 },
  chipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: colors.primary },
  feedbackInput: { minHeight: 96, paddingTop: 12 },
  appearanceOptions: { flexDirection: "row", gap: spacing.xs },
  appearanceOption: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 46, justifyContent: "center", paddingHorizontal: 8 },
  appearanceOptionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
  appearanceOptionText: { color: colors.muted, fontSize: 13, fontWeight: "800" },
  appearanceOptionTextSelected: { color: colors.primary },
  proCard: { backgroundColor: colors.purpleSoft, borderColor: colors.primary, gap: spacing.xs },
  petTypes: { flexDirection: "row", gap: spacing.sm },
  petChoice: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flex: 1, padding: spacing.xs },
  petChoiceSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  petSummary: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  settingValue: { color: colors.text, fontSize: 15, fontWeight: "800" },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: spacing.xs },
  buildLabel: { color: colors.primary, fontSize: 11, fontWeight: "900", letterSpacing: 0.35 },
  pressed: { opacity: 0.76 },
  pickerOverlay: { flex: 1, justifyContent: "flex-end" },
  pickerBackdrop: { backgroundColor: "rgba(30,24,42,.38)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  pickerSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "72%", paddingBottom: 24, paddingHorizontal: spacing.md, paddingTop: 10 },
  pickerHandle: { alignSelf: "center", backgroundColor: colors.border, borderRadius: 99, height: 5, marginBottom: spacing.md, width: 42 },
  calendarHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm, paddingHorizontal: 5 },
  calendarArrow: { alignItems: "center", borderRadius: 99, height: 40, justifyContent: "center", width: 40 },
  calendarArrowText: { color: colors.primary, fontSize: 28, fontWeight: "700", lineHeight: 32 },
  calendarHeading: { alignItems: "center", flexDirection: "row", gap: 8 },
  calendarMonthTitle: { color: "#CE737D", fontSize: 22, fontWeight: "700" },
  calendarYearTitle: { color: colors.muted, fontSize: 17, fontWeight: "700" },
  weekdays: { flexDirection: "row", marginBottom: 2 },
  weekday: { color: colors.muted, flex: 1, fontSize: 11, fontWeight: "800", paddingVertical: 7, textAlign: "center" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: { alignItems: "center", borderRadius: 99, height: 42, justifyContent: "center", width: "14.2857%" },
  calendarDayInPeriod: { backgroundColor: colors.primarySoft },
  calendarDaySelected: { backgroundColor: colors.primaryStrong },
  calendarDayPressed: { opacity: 0.55 },
  calendarDayText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  calendarAdjacentText: { color: colors.muted, opacity: 0.46 },
  calendarInPeriodText: { color: colors.primary, fontWeight: "900" },
  calendarSelectedText: { color: colors.onPrimary },
  calendarFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  calendarHint: { color: colors.muted, flex: 1, fontSize: 10, fontWeight: "700" },
  todayButton: { backgroundColor: colors.primarySoft, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 8 },
  todayButtonText: { color: colors.primary, fontSize: 11, fontWeight: "900" },
});
