import { CLEAN_DURATION_MS } from "../cleanChoreography";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { useApp } from "../AppContext";
import { Card } from "../components/Card";
import { FinancialInfoSheet, InfoButton, type FinancialInfoContent } from "../components/FinancialInfoSheet";
import { RoomScene } from "../components/RoomScene";
import { Screen } from "../components/Screen";
import { StatBar } from "../components/StatBar";
import { todayKey } from "../date";
import { AppText as Text } from "../display";
import { actionInfo, stageForLevel } from "../game";
import { getPetMoment, getPetTapMoment, type PetMoment } from "../reactions";
import { colors, spacing } from "../theme";
import type { MoneyInsightNotice, PetAction, PetVisualState } from "../types";

import { ANIMAL_PLAY_DURATION_MS } from "../animalPlayChoreography";
import { PLAY_DURATION_MS } from "../playChoreography";

const actions = Object.keys(actionInfo) as PetAction[];

export function PetScreen() {
  const { snapshot, performAction, usePremiumTreat, roomEvent, clearRoomEvent } = useApp();
  const [busy, setBusy] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [tapState, setTapState] = useState<PetMoment["state"] | null>(null);
  const [actionState, setActionState] = useState<PetVisualState | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [moneyInsight, setMoneyInsight] = useState<MoneyInsightNotice | null>(null);
  const [showOpportunityInfo, setShowOpportunityInfo] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
  }, []);

  useEffect(() => {
    if (!roomEvent) return;
    if (tapTimer.current) clearTimeout(tapTimer.current);

    const savedExpense = roomEvent.type === "first_record" || roomEvent.type === "recorded" || roomEvent.type === "waking" || roomEvent.type === "awake";
    const goalReached = roomEvent.type === "goal_complete";
    if (roomEvent.moneyInsight) setMoneyInsight(roomEvent.moneyInsight);
    if (savedExpense || goalReached) {
      setTapState(null);
      setActionState("celebrate");
      setShowConfetti(true);
      setReaction(goalReached ? "Goal reached! We built this together!" : "Saved! I’m celebrating your honest check-in!");
      tapTimer.current = setTimeout(() => {
        setActionState(null);
        setShowConfetti(false);
        setReaction(null);
      }, 4600);
    }
    clearRoomEvent();
  }, [clearRoomEvent, roomEvent]);
  if (!snapshot) return null;

  const { pet, settings } = snapshot;
  const unlocked = settings.lastCheckinDate === todayKey() && !pet.sleepingSince;
  const moment = getPetMoment(snapshot);
  const goalPercent = snapshot.savingsGoal ? Math.min(100, Math.round(snapshot.savingsGoal.savedCents / snapshot.savingsGoal.targetCents * 100)) : 0;
  const opportunityInfo: FinancialInfoContent = {
    title: "Opportunity Cost",
    whatItMeans: "Opportunity cost shows what else the same money could have supported. Pennykin uses it to add context after a Want—not to decide whether your purchase was worthwhile.",
    formulas: [
      "Safe-spend equivalent = this Want ÷ Safe to Spend Today before saving",
      "Savings-goal equivalent = this Want ÷ remaining goal gap × 100%",
      "Weekly-room share = this Want ÷ remaining weekly budget × 100%",
    ],
    numbers: moneyInsight?.lines ?? ["Save a Want to see your own numbers here."],
    keepInMind: [
      "The comparison uses the plan as it looked immediately before this expense was saved.",
      "If a comparison amount is $0.00, Pennykin skips that division instead of showing an invalid result.",
      "A Want can still be meaningful, fun, or worth choosing.",
    ],
    why: "Turning dollars into days, weekly room, or goal progress makes trade-offs easier to notice without rewarding less spending or punishing honest records.",
  };

  const act = async (action: PetAction) => {
    try {
      setBusy(true);
      if (tapTimer.current) clearTimeout(tapTimer.current);
      setTapState(null);
      const actionVisual: Record<PetAction, PetVisualState> = { feed: "eating", play: "playing", rest: "sleeping", clean: "bathing", vet: "worried" };
      setActionState(actionVisual[action]);
      setReaction(await performAction(action));
      const duration: Record<PetAction, number> = { feed: 4400, play: settings.petType === "cat" ? PLAY_DURATION_MS : ANIMAL_PLAY_DURATION_MS, rest: 5000, clean: CLEAN_DURATION_MS, vet: 3400 };
      tapTimer.current = setTimeout(() => { setActionState(null); setReaction(null); }, duration[action]);
    } catch (error) {
      setActionState(null);
      Alert.alert("Not yet", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const giveTreat = async () => {
    try {
      setBusy(true);
      if (tapTimer.current) clearTimeout(tapTimer.current);
      setTapState(null);
      setActionState("eating");
      setReaction(await usePremiumTreat());
      tapTimer.current = setTimeout(() => { setActionState(null); setReaction(null); }, 4400);
    } catch (error) {
      setActionState(null);
      Alert.alert("Could not use treat", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const respondToPetTap = () => {
    tapCount.current += 1;
    const next = getPetTapMoment(snapshot, tapCount.current);
    setReaction(next.message);
    setTapState(next.state);
    setActionState(null);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      setReaction(null);
      setTapState(null);
    }, 4200);
  };

  return (
    <>
    <Screen title={`${settings.petName}’s room`} subtitle={`Level ${pet.level} · ${stageForLevel(pet.level)} · tap your pet to say hello`}>
      <View style={styles.bubble}><Text style={styles.bubbleText}>{reaction ?? moment.message}</Text></View>
      <RoomScene
        equipment={snapshot.equippedItems}
        goalPercent={goalPercent}
        onPetPress={respondToPetTap}
        petState={actionState ?? tapState ?? moment.state}
        petType={settings.petType}
        showConfetti={showConfetti}
      />
      {moneyInsight ? <Card style={styles.moneyInsight}>
        <View style={styles.moneyInsightHeader}><View style={styles.moneyInsightIcon}><Text style={styles.moneyInsightIconText}>↔</Text></View><View style={styles.moneyInsightCopy}><Text style={styles.moneyInsightEyebrow}>MONEY INSIGHT</Text><Text style={styles.moneyInsightTitle}>{moneyInsight.title}</Text></View><InfoButton label="Opportunity Cost" onPress={() => setShowOpportunityInfo(true)} /><Pressable accessibilityRole="button" onPress={() => setMoneyInsight(null)}><Text style={styles.dismiss}>Close</Text></Pressable></View>
        {moneyInsight.lines.map((line) => <Text key={line} style={styles.moneyInsightLine}>• {line}</Text>)}
      </Card> : null}
      <View style={styles.resources}>
        <Text style={styles.resource}>⚡ {pet.tokens} energy</Text>
        <Text style={styles.resource}>◉ {pet.coins} coins</Text>
        <Text style={styles.resource}>✦ {pet.xp} XP</Text>
      </View>

      {!unlocked ? (
        <Card style={styles.locked}>
          <Text style={styles.lockTitle}>{pet.sleepingSince ? "A gentle wake-up is in progress" : "A check-in opens playtime"}</Text>
          <Text style={styles.lockBody}>{pet.sleepingSince ? `${pet.wakeProgress}/2 wake-up check-ins complete. Record ${2 - pet.wakeProgress} more honest entry to wake your pet.` : "Record an expense or a no-spend day first. Your pet is only resting—not sick or disappointed."}</Text>
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>Spend time together</Text>
      <View style={styles.actionGrid}>
        {actions.map((action) => {
          const info = actionInfo[action];
          return (
            <Pressable
              accessibilityRole="button"
              disabled={!unlocked || busy}
              key={action}
              onPress={() => act(action)}
              style={({ pressed }) => [styles.action, !unlocked && styles.actionDisabled, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionEmoji}>{info.emoji}</Text>
              <View style={styles.actionCopy}><Text style={styles.actionLabel}>{info.label}</Text><Text style={styles.actionDetail}>{info.detail}</Text></View>
            </Pressable>
          );
        })}
        {pet.premiumTreats > 0 ? (
          <Pressable disabled={!unlocked || busy} onPress={giveTreat} style={styles.treatAction}>
            <Text style={styles.actionEmoji}>✦</Text><View style={styles.actionCopy}><Text style={styles.actionLabel}>Special treat</Text><Text style={styles.actionDetail}>{pet.premiumTreats} waiting</Text></View>
          </Pressable>
        ) : null}
      </View>

      <Card style={styles.stats}>
        <Text style={styles.sectionTitle}>How {settings.petName} feels</Text>
        <StatBar label="Fullness" value={100 - pet.hunger} color={colors.secondary} />
        <StatBar label="Happiness" value={pet.happiness} color={colors.yellow} />
        <StatBar label="Energy" value={pet.energy} color={colors.primary} />
        <StatBar label="Cleanliness" value={pet.cleanliness} color="#53A9D8" />
        <StatBar label="Health" value={pet.health} color={colors.green} />
      </Card>

      <Card>
        <Text style={styles.inventoryTitle}>{snapshot.ownedItems.length} collection entries discovered</Text>
        <Text style={styles.lockBody}>Visit Collection to read each item’s story or swap what appears in this room.</Text>
      </Card>
    </Screen>
    <FinancialInfoSheet content={opportunityInfo} onClose={() => setShowOpportunityInfo(false)} visible={showOpportunityInfo} />
    </>
  );
}

const styles = StyleSheet.create({
  bubble: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 14 },
  bubbleText: { color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  resources: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  resource: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 99, borderWidth: 1, color: colors.text, fontSize: 12, fontWeight: "800", paddingHorizontal: 12, paddingVertical: 7 },
  locked: { backgroundColor: colors.orangeSoft, borderColor: colors.secondary, gap: spacing.xs },
  lockTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  lockBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: "row", minHeight: 76, padding: 12, width: "48%" },
  treatAction: { alignItems: "center", backgroundColor: colors.yellowSoft, borderColor: colors.yellow, borderRadius: 17, borderWidth: 1, flexDirection: "row", minHeight: 76, padding: 12, width: "48%" },
  actionDisabled: { opacity: 0.4 },
  actionPressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  actionEmoji: { fontSize: 25, marginRight: 8 },
  actionCopy: { flex: 1 },
  actionLabel: { color: colors.text, fontSize: 13, fontWeight: "900" },
  actionDetail: { color: colors.muted, fontSize: 10, marginTop: 2 },
  stats: { gap: spacing.md },
  inventoryTitle: { color: colors.text, fontSize: 15, fontWeight: "900", marginBottom: 4 },
  moneyInsight: { backgroundColor: colors.purpleSoft, borderColor: colors.purpleBorder, gap: spacing.xs }, moneyInsightHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm }, moneyInsightIcon: { alignItems: "center", backgroundColor: colors.primaryStrong, borderRadius: 99, height: 34, justifyContent: "center", width: 34 }, moneyInsightIconText: { color: colors.onPrimary, fontSize: 18, fontWeight: "900" }, moneyInsightCopy: { flex: 1 }, moneyInsightEyebrow: { color: colors.primary, fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, moneyInsightTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 2 }, moneyInsightLine: { color: colors.muted, fontSize: 12, lineHeight: 18 }, dismiss: { color: colors.primary, fontSize: 11, fontWeight: "800", padding: 6 },
});
