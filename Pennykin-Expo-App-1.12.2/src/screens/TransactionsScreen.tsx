import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { useTodayTransactions } from "../useFinancialQueries";
import { useApp } from "../AppContext";
import { BUDGET_CATEGORIES, getBudgetMetrics } from "../budget";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { formatMoney } from "../date";
import { AppText as Text, AppTextInput as TextInput } from "../display";
import { colors, spacing } from "../theme";
import type { NeedWant, TabName, Transaction } from "../types";

function amountToCents(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole = "0", decimal = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

export function TransactionsScreen({ navigate }: { navigate: (tab: TabName) => void }) {
  const { snapshot, saveTransaction, deleteTransaction, markNoSpend } = useApp();
  const entries = useTodayTransactions(snapshot);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [needWant, setNeedWant] = useState<NeedWant>("Need");
  const [editingId, setEditingId] = useState<number | undefined>();
  const [busy, setBusy] = useState(false);
  if (!snapshot) return null;

  const today = snapshot.financialActuals.dateKey;
  const todaysTransactions = entries.items;
  const checkedIn = snapshot.settings.lastCheckinDate === today;
  const isNoSpend = snapshot.settings.noSpendDate === today;
  const giftProgress = Math.min(3, snapshot.financialActuals.todayCount);
  const metrics = getBudgetMetrics(snapshot);
  const typedCents = amountToCents(amount);
  const safeSharePercent = typedCents && metrics.safeTodayCents > 0
    ? Math.round((typedCents / metrics.safeTodayCents) * 100)
    : null;
  const categoryRow = metrics.categoryRows.find((item) => item.category === category);

  const liveNudge = (() => {
    if (!typedCents || typedCents <= 0) {
      return needWant === "Want"
        ? "Enter an amount to see its opportunity cost before saving."
        : "Enter an amount to see how this Need fits today’s plan.";
    }
    if (metrics.safeTodayCents <= 0) {
      return "Today’s flexible amount is $0.00. You can still record this honestly—Pennykin will rebalance the remaining week without penalty.";
    }
    if (needWant === "Want") {
      return `This is about ${safeSharePercent}% of today’s Safe to Spend (${formatMoney(metrics.safeTodayCents)}). Context only—you decide whether it is worth choosing.`;
    }
    const categoryContext = categoryRow && categoryRow.plannedCents > 0
      ? ` The ${category} plan currently has ${formatMoney(Math.max(0, categoryRow.remainingCents))} left.`
      : "";
    return `This is about ${safeSharePercent}% of today’s Safe to Spend. After saving, it will be included in recorded Needs.${categoryContext}`;
  })();

  const resetForm = () => {
    setAmount("");
    setCategory("Food");
    setNote("");
    setNeedWant("Need");
    setEditingId(undefined);
  };

  const submit = async () => {
    const cents = amountToCents(amount);
    if (cents === null || cents <= 0) {
      Alert.alert("Check the amount", "Use a positive amount with no more than two decimal places.");
      return;
    }
    try {
      setBusy(true);
      const isNewExpense = editingId === undefined;
      const message = await saveTransaction({ id: editingId, amountCents: cents, category, note: note.trim() || category, needWant });
      resetForm();
      if (isNewExpense) {
        navigate("home");
      } else {
        Alert.alert("Expense updated", message);
      }
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setAmount((transaction.amountCents / 100).toFixed(2));
    setCategory(transaction.category);
    setNote(transaction.note);
    setNeedWant(transaction.needWant);
  };

  const confirmDelete = (transaction: Transaction) => {
    Alert.alert("Delete this expense?", `${transaction.note} · ${formatMoney(transaction.amountCents)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTransaction(transaction.id).catch((error: unknown) => {
            Alert.alert("Could not delete", error instanceof Error ? error.message : "Something went wrong.");
          });
          if (editingId === transaction.id) resetForm();
        },
      },
    ]);
  };

  const noSpend = async () => {
    try {
      setBusy(true);
      const message = await markNoSpend();
      Alert.alert("No-spend day", message);
    } catch (error) {
      Alert.alert("Cannot mark no-spend", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Money check-in" subtitle="You can record as many expenses as you need.">
      <Card style={[styles.status, checkedIn && styles.statusDone]}>
        <Text style={styles.statusTitle}>
          {isNoSpend ? "🌱 No-spend day" : checkedIn ? "✓ Checked in today" : "Not checked in yet"}
        </Text>
        <Text style={styles.statusBody}>
          {checkedIn
            ? "Pet care is unlocked. Three honest entries today also bring one mystery gift."
            : "One honest check-in earns today’s reward, whether you spent money or not."}
        </Text>
      </Card>

      <Card style={styles.form}>
        <View style={styles.formHeading}><View><Text style={styles.formEyebrow}>QUICK CHECK-IN</Text><Text style={styles.formTitle}>{editingId === undefined ? "Add an expense" : "Edit expense"}</Text></View><View style={styles.offlinePill}><Text style={styles.offlinePillText}>✓ Works offline</Text></View></View>

        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            accessibilityLabel="Expense amount"
            autoFocus={editingId === undefined}
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#AAA3B2"
            style={styles.amountInput}
            value={amount}
          />
        </View>

        <Text style={styles.label}>Was it a need or a want?</Text>
        <View style={styles.segment}>
          {(["Need", "Want"] as NeedWant[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setNeedWant(item)}
              style={[styles.segmentButton, needWant === item && styles.segmentSelected]}
            >
              <Text style={[styles.segmentText, needWant === item && styles.segmentTextSelected]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="summary"
          style={[styles.nudge, needWant === "Want" ? styles.wantNudge : styles.needNudge]}
        >
          <Text style={styles.nudgeIcon}>{needWant === "Want" ? "↔" : "◒"}</Text>
          <View style={styles.nudgeCopy}><Text style={styles.nudgeLabel}>{needWant === "Want" ? "OPPORTUNITY CHECK" : "PLAN CHECK"}</Text><Text style={styles.nudgeText}>{liveNudge}</Text></View>
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {BUDGET_CATEGORIES.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.chip, category === item && styles.chipSelected]}
            >
              <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          accessibilityLabel="Expense description"
          maxLength={80}
          onChangeText={setNote}
          placeholder="e.g. lunch, bus ticket, notebook"
          placeholderTextColor="#AAA3B2"
          style={styles.textInput}
          value={note}
        />

        <Button disabled={busy} label={editingId === undefined ? "Save expense" : "Update expense"} onPress={submit} />
        <Text style={styles.rewardNote}>Saved directly to this device. Your amount affects your budget, but never the size of your pet reward.</Text>
        {editingId !== undefined ? <Button label="Cancel editing" onPress={resetForm} variant="secondary" /> : null}
      </Card>

      <Card style={styles.giftTrail}>
        <View style={styles.giftTrailHeader}><Text style={styles.giftTrailTitle}>Mystery gift trail</Text><Text style={styles.giftTrailCount}>{giftProgress}/3</Text></View>
        <View style={styles.giftDots}>{[0, 1, 2].map((index) => <View key={index} style={[styles.giftDot, index < giftProgress && styles.giftDotDone]} />)}</View>
        <Text style={styles.rewardNote}>{giftProgress >= 3 ? "Today’s gift is earned. This trail resets after midnight, even if another day ended at 1/3 or 2/3." : "Three new entries today guarantee 10 Pet Coins plus one surprise. Yesterday’s progress never carries over."} The amount you spend never changes the reward.</Text>
      </Card>

      <Button
        disabled={busy || snapshot.financialActuals.todayCount > 0}
        label={isNoSpend ? "No-spend day recorded" : "I spent $0 today"}
        onPress={noSpend}
        variant="secondary"
      />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Today’s entries</Text>
        <Text style={styles.listTotal}>
          {formatMoney(snapshot.financialActuals.todaySpentCents)}
        </Text>
      </View>

      {entries.error ? <Card><Text style={styles.empty}>{entries.error}</Text><Button label="Retry loading entries" onPress={entries.retry} /></Card> : null}
      {entries.loading && todaysTransactions.length === 0 ? <Card><Text style={styles.empty}>Loading entries…</Text></Card> : null}
      {snapshot.financialActuals.todayCount === 0 ? (
        <Card><Text style={styles.empty}>No expenses recorded today.</Text></Card>
      ) : (
        todaysTransactions.map((item) => (
          <Card key={item.id} style={styles.transaction}>
            <View style={styles.transactionMain}>
              <View style={styles.transactionText}>
                <Text style={styles.transactionNote}>{item.note}</Text>
                <Text style={styles.transactionMeta}>{item.category} · {item.needWant}</Text>
              </View>
              <Text style={styles.transactionAmount}>{formatMoney(item.amountCents)}</Text>
            </View>
            <View style={styles.transactionActions}>
              <Pressable onPress={() => startEdit(item)}><Text style={styles.edit}>Edit</Text></Pressable>
              <Pressable onPress={() => confirmDelete(item)}><Text style={styles.delete}>Delete</Text></Pressable>
            </View>
          </Card>
        ))
      )}
      {entries.hasMore ? <Button disabled={entries.loading} label={entries.loading ? "Loading…" : "Load more entries"} onPress={() => { void entries.loadMore(); }} variant="secondary" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { backgroundColor: colors.orangeSoft, borderColor: colors.secondary, gap: spacing.xs },
  statusDone: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  statusTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  statusBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  form: { gap: spacing.sm },
  formHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  formEyebrow: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  formTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 2 },
  offlinePill: { backgroundColor: colors.greenSoft, borderColor: colors.green, borderRadius: 99, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 6 },
  offlinePillText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  label: { color: colors.text, fontSize: 13, fontWeight: "700", marginTop: spacing.xs },
  amountRow: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row" },
  currency: { color: colors.text, fontSize: 28, fontWeight: "700" },
  amountInput: { color: colors.text, flex: 1, fontSize: 34, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  chipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextSelected: { color: colors.primary },
  segment: { backgroundColor: colors.background, borderRadius: 12, flexDirection: "row", padding: 3 },
  segmentButton: { alignItems: "center", borderRadius: 10, flex: 1, paddingVertical: 10 },
  segmentSelected: { backgroundColor: colors.surface },
  segmentText: { color: colors.muted, fontWeight: "700" },
  segmentTextSelected: { color: colors.primary },
  nudge: { alignItems: "flex-start", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.sm },
  wantNudge: { backgroundColor: colors.purpleSoft, borderColor: colors.purpleBorder },
  needNudge: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  nudgeIcon: { color: colors.primary, fontSize: 18, fontWeight: "900", marginTop: 1 },
  nudgeCopy: { flex: 1, gap: 2 },
  nudgeLabel: { color: colors.primary, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  nudgeText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  textInput: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 15, minHeight: 48, paddingHorizontal: 12 },
  rewardNote: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  giftTrail: { backgroundColor: colors.yellowSoft, borderColor: colors.yellowBorder, gap: spacing.sm },
  giftTrailHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  giftTrailTitle: { color: colors.text, fontSize: 15, fontWeight: "900" },
  giftTrailCount: { color: colors.primary, fontSize: 13, fontWeight: "900" },
  giftDots: { flexDirection: "row", gap: spacing.xs },
  giftDot: { backgroundColor: colors.track, borderRadius: 99, flex: 1, height: 8 },
  giftDotDone: { backgroundColor: colors.secondary },
  listHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  listTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  listTotal: { color: colors.text, fontSize: 16, fontWeight: "800" },
  empty: { color: colors.muted, fontSize: 14, textAlign: "center" },
  transaction: { gap: spacing.sm },
  transactionMain: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  transactionText: { flex: 1 },
  transactionNote: { color: colors.text, fontSize: 16, fontWeight: "700" },
  transactionMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  transactionAmount: { color: colors.text, fontSize: 17, fontWeight: "800" },
  transactionActions: { borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.lg, justifyContent: "flex-end", paddingTop: spacing.sm },
  edit: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  delete: { color: colors.red, fontSize: 13, fontWeight: "700" },
});
