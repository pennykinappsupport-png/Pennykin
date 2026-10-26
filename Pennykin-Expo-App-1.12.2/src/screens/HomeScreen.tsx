import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { preloadBathArtwork } from "../artworkLoader";
import { useApp } from "../AppContext";
import { getBudgetMetrics } from "../budget";
import { ANIMAL_PLAY_DURATION_MS, ANIMAL_PLAY_MESSAGES } from "../animalPlayChoreography";
import { PLAY_DURATION_MS, PLAY_MESSAGES } from "../playChoreography";
import { CLEAN_DURATION_MS, CLEAN_MESSAGES } from "../cleanChoreography";
import { FEED_DURATION_MS } from "../careChoreography";
import { getCollectible } from "../collectibles";
import { CareActionButton } from "../components/CareActionButton";
import { Button } from "../components/Button";
import { BarChartIcon } from "../components/BarChartIcon";
import { ItemArt } from "../components/ItemArt";
import { RoomScene } from "../components/RoomScene";
import { Screen } from "../components/Screen";
import { StatBar } from "../components/StatBar";
import { formatMoney, todayKey } from "../date";
import { AppText as Text } from "../display";
import { actionInfo, stageForLevel } from "../game";
import { getPetMoment, getPetTapMoment } from "../reactions";
import { colors, spacing } from "../theme";
import type { GiftResult, PetAction, PetVisualState, RoomEventType, TabName } from "../types";
import { usePetAnimationMachine } from "../usePetAnimationMachine";
import { useVetVisit } from "../useVetVisit";
import { vetMessage } from "../vetVisit";
import { VetClinicControls } from "../components/VetClinic";
import { REST_DURATION_MS, REST_MESSAGES, restTransitionLocked, type RestStage } from "../restChoreography";
import { RestFeedback } from "../components/RestFeedback";
import { createCareMutationQueue } from "../careMutationQueue";

function GiftBox({ ready, onPress }: { ready: boolean; onPress: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!ready) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { duration: 600, toValue: 1, useNativeDriver: true }),
      Animated.timing(pulse, { duration: 600, toValue: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, ready]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return (
    <Pressable accessibilityRole="button" disabled={!ready} onPress={onPress}>
      <Animated.View style={[styles.gift, ready && styles.giftReady, { transform: [{ scale }] }]}> 
        <View style={styles.giftGlow} />
        <ItemArt itemId="mystery_gift" size={78} />
        <Text style={styles.giftLabel}>{ready ? "OPEN" : "SOON"}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function HomeScreen({ navigate }: { navigate: (tab: TabName) => void }) {
  const { snapshot, openGift, equipItem, performAction, usePremiumTreat, roomEvent, clearRoomEvent } = useApp();
  useEffect(() => {
    if(snapshot) preloadBathArtwork(snapshot.settings.petType).catch(()=>undefined);
  }, [snapshot?.settings.petType]);
  const [opening, setOpening] = useState(false);
  const [careBusy, setCareBusy] = useState(false);
  const careBusyCount = useRef(0);
  const markCareBusy = (delta: number) => {
    careBusyCount.current = Math.max(0, careBusyCount.current + delta);
    setCareBusy(careBusyCount.current > 0);
  };
  const [hasRested, setHasRested] = useState(false);
  const [awakeAfterCare, setAwakeAfterCare] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showPetStats, setShowPetStats] = useState(false);
  const [result, setResult] = useState<GiftResult | null>(null);
  const tapCount = useRef(0);
  const careWrites = useRef(createCareMutationQueue()).current;
  const fallbackMoment = snapshot ? getPetMoment(snapshot) : { message: "Waking up your pet…", state: "calm" as PetVisualState };
  const animation = usePetAnimationMachine({ fallbackMessage: fallbackMoment.message,
    fallbackState: (awakeAfterCare || hasRested) && !snapshot?.pet.sleepingSince ? "calm" : fallbackMoment.state });
  const finishClean = useCallback((id: string) => {
    // Ignore stale completion from a cancelled/replaced scene. Keep the
    // explicit clean→idle handoff awake even after the 8pm night threshold.
    if (animation.active?.id !== id || animation.active.state !== "bathing") return;
    setAwakeAfterCare(true);
    animation.finishManual(id);
  }, [animation.active?.id, animation.active?.state, animation.finishManual]);
  const failClean = useCallback((id: string) => {
    if(animation.active?.id!==id || animation.active.state!=="bathing")return;
    animation.cancelById(id);
    Alert.alert("Bath could not start", "Please reopen the app and try again.");
  },[animation.active?.id,animation.active?.state,animation.cancelById]);
  const finishNativeRest=useCallback((id:string,stage:RestStage)=>{
    if(animation.active?.id!==id || !animation.active.restNative || animation.restStage!==stage)return;
    if(stage==="Rest_Exit")setAwakeAfterCare(true);
    animation.finishRestStage(id,stage);
  },[animation.active?.id,animation.active?.restNative,animation.restStage,animation.finishRestStage]);
  const failRest = useCallback((id:string)=>{
    if(animation.active?.id!==id || !animation.active.restNative)return;
    animation.cancelById(id);Alert.alert("Rest could not start","Please reopen the app and try again.");
  },[animation.active?.id,animation.active?.restNative,animation.cancelById]);
  const vet = useVetVisit({ activeId: animation.active?.state === "vet" ? animation.active.id : undefined, paused: animation.isPaused, onFinished: animation.finishManual });
  const vetTreatmentLock = useRef<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (vet.visit) animation.updateMessage(vet.visit.id, vetMessage(vet.visit.stage));
  }, [animation.updateMessage, vet.visit?.id, vet.visit?.stage]);

  useEffect(() => {
    if (!roomEvent) return;
    const feedback: Record<RoomEventType, { durationMs: number; message: string; state: PetVisualState }> = {
      first_record: { durationMs: 4200, message: "You found me! That first honest record helped me peek out.", state: "peek" },
      recorded: { durationMs: 4400, message: "Today is recorded—happy paws! Thanks for showing up honestly.", state: "celebrate" },
      no_spend: { durationMs: 4400, message: "Clink! I put a little coin in our savings jar for today’s check-in.", state: "saving" },
      waking: { durationMs: 4000, message: "I heard that check-in in my dream. One more will gently wake me.", state: "waking" },
      awake: { durationMs: 4400, message: "I’m awake! Thank you for coming back—let’s celebrate the fresh start.", state: "celebrate" },
      goal_25: { durationMs: 4000, message: "A quarter of the way there! I found a little box for our dream.", state: "curious" },
      goal_50: { durationMs: 4400, message: "Halfway! Listen—the savings jar has a happy little clink.", state: "saving" },
      goal_complete: { durationMs: 5000, message: "We did it! Our savings dream is ready for a room party!", state: "celebrate" },
    };
    const next = feedback[roomEvent.type];
    animation.play({ id: `room-event-${roomEvent.id}`, priority: "important", ...next });
    clearRoomEvent();
  }, [animation.play, clearRoomEvent, roomEvent]);
  if (!snapshot) return null;

  const { pet, settings, pendingGifts } = snapshot;
  const budgetMetrics = getBudgetMetrics(snapshot);
  const goal = snapshot.savingsGoal;
  const goalPercent = goal ? Math.min(100, Math.round((goal.savedCents / goal.targetCents) * 100)) : 0;
  const progress = Math.min(3, snapshot.financialActuals.todayCount);
  const gift = pendingGifts[0];
  const careUnlocked = settings.lastCheckinDate === todayKey() && !pet.sleepingSince;
  const careDisabled = !careUnlocked || careBusy || animation.isBusy;

  const claimGift = async () => {
    if (!gift || opening || animation.isBusy || animation.restStage) return;
    const giftAnimationId = animation.play({
      id: `gift-open-${gift.id}`,
      state: "gift",
      message: "Let’s open it together—what could be inside?",
      durationMs: 1600,
      priority: "important",
    });
    if (!giftAnimationId) return;
    try {
      setOpening(true);
      await new Promise((resolve) => setTimeout(resolve, 850));
      setResult(await openGift(gift.id));
      animation.play({
        id: `gift-celebrate-${gift.id}`,
        state: "celebrate",
        message: "A new little treasure for the life we’re building!",
        durationMs: 3600,
        priority: "important",
      });
    } catch (error) {
      animation.cancelActive();
      Alert.alert("Could not open gift", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setOpening(false);
    }
  };

  const equipReward = async () => {
    if (!result?.itemId) return;
    try {
      await equipItem(result.itemId);
      setResult(null);
    } catch (error) {
      Alert.alert("Could not place item", error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  const respondToPetTap = () => {
    if (animation.restStage) { animation.wakeRest("screenTap"); return; }
    const visit = vet.visitRef.current;
    if (visit && visit.id === animation.active?.id) {
      if (visit.stage === "soothe" && !animation.isPaused) vet.send({ type: "SOOTHE", id: visit.id });
      return;
    }
    const nextTapCount = tapCount.current + 1;
    const next = getPetTapMoment(snapshot, nextTapCount);
    const animationId = animation.play({ state: next.state, message: next.message, durationMs: 1800, priority: "tap" });
    if (animationId) tapCount.current = nextTapCount;
  };

  const careForPet = async (action: PetAction) => {
    if (!careUnlocked || careBusyCount.current > 0 || animation.isPaused || restTransitionLocked(animation.restStage)) return;
    if (action === "vet") {
      if (pet.coins < 20) { Alert.alert("Not yet", "You need 20 pet coins for a vet visit."); return; }
      const id = animation.play({ state: "vet", manual: true, durationMs: 6000, message: vetMessage("checking") });
      if (!id) return;
      markCareBusy(1);
      try {
        // When sleeping, this request waits behind the whole wake-up phase.
        if (await animation.whenActive(id) && mounted.current) vet.send({ type: "START", id });
      } finally { if (mounted.current) markCareBusy(-1); }
      return;
    }
    const visual: Record<PetAction, PetVisualState> = { feed: "eating", play: "playing", rest: "sleeping", clean: "bathing", vet: "worried" };
    const duration: Record<PetAction, number> = { feed: FEED_DURATION_MS, play: settings.petType === "cat" ? PLAY_DURATION_MS : ANIMAL_PLAY_DURATION_MS, rest: REST_DURATION_MS, clean: CLEAN_DURATION_MS, vet: 3400 };
    const startingMessage: Record<PetAction, string> = { feed: "Ooh, snack time—let me get ready!", play: settings.petType === "cat" ? PLAY_MESSAGES[0] : ANIMAL_PLAY_MESSAGES[0], rest: REST_MESSAGES.Rest_Enter, clean: CLEAN_MESSAGES[0], vet: "A calm check-up is starting." };
    const animationId = action === "rest" ? animation.triggerYawn(true) : animation.play({ state: visual[action], message: startingMessage[action], durationMs: duration[action], manual: action === "feed" || action === "clean" });
    if (!animationId) return;
    setAwakeAfterCare(false);
    let locked = action !== "rest";
    if (action === "rest") setHasRested(true);
    if (locked) markCareBusy(1);
    try {
      // Rest rewards are committed once at wake-up. Other care only consumes
      // coins/energy when it actually starts, after Rest_Exit has finished.
      const ready = action === "rest" ? await animation.whenRestExit(animationId) : await animation.whenActive(animationId);
      if (!ready || !mounted.current) return;
      if (!locked) { locked = true; markCareBusy(1); }
      const resultMessage = await careWrites.run(() => performAction(action));
      if (mounted.current && action !== "play" && action !== "rest" && action !== "clean") animation.updateMessage(animationId, resultMessage);
    } catch (error) {
      if (mounted.current) {
        // A slow failed write must never cancel a newer animation.
        animation.cancelById(animationId);
        Alert.alert("Not yet", error instanceof Error ? error.message : "Something went wrong.");
      }
    } finally {
      if (locked && mounted.current) markCareBusy(-1);
    }
  };

  const treatVet = async () => {
    const visit = vet.visitRef.current;
    if (!visit || visit.stage !== "treat" || visit.id !== animation.active?.id || animation.isPaused || vetTreatmentLock.current) return;
    // Set the lock and transition synchronously, before the database promise.
    vetTreatmentLock.current = visit.id;
    vet.send({ type: "TREAT", id: visit.id });
    try {
      await careWrites.run(() => performAction("vet"));
      if (mounted.current) vet.send({ type: "APPLIED", id: visit.id });
    } catch (error) {
      if (mounted.current) {
        vet.send({ type: "FAILED", id: visit.id });
        Alert.alert("Could not apply patch", error instanceof Error ? error.message : "Please try again.");
      }
    } finally {
      if (vetTreatmentLock.current === visit.id) vetTreatmentLock.current = null;
    }
  };

  const closeVet = () => {
    const visit = vet.visitRef.current;
    if (!visit || visit.stage === "treating" || animation.isPaused) return;
    if (visit.id === animation.active?.id) animation.cancelActive();
    vet.send({ type: "CLEAR" });
  };

  const giveSpecialTreat = async () => {
    if (!careUnlocked || careBusyCount.current > 0 || animation.isPaused || restTransitionLocked(animation.restStage)) return;
    const animationId = animation.play({ state: "eating", message: "A special treat—just one delicious bite!", durationMs: FEED_DURATION_MS });
    if (!animationId) return;
    try {
      markCareBusy(1);
      if (!await animation.whenActive(animationId) || !mounted.current) return;
      const message = await careWrites.run(() => usePremiumTreat());
      if (mounted.current) animation.updateMessage(animationId, message);
    } catch (error) {
      if (mounted.current) {
        animation.cancelById(animationId);
        Alert.alert("No treat available", error instanceof Error ? error.message : "Something went wrong.");
      }
    } finally {
      if (mounted.current) markCareBusy(-1);
    }
  };

  return (
    <>
      <Screen title="Your little home" subtitle="Built one honest money check-in at a time.">
        <View style={styles.roomFrame}>
          <RoomScene
            allowNightSleep={!hasRested && !awakeAfterCare}
            restStage={animation.restStage}
            onRestStageFinished={finishNativeRest}
            onRestError={failRest}
            restFeedbackKey={animation.restFeedbackKey}
            animateArrival={animation.active?.priority !== "tap"}
            animationKey={animation.active?.id}
            equipment={snapshot.equippedItems}
            goalPercent={goalPercent}
            height={400}
            onPlayMessage={animation.updateMessage}
            onFeedComplete={animation.finishManual}
            onFeedError={animation.cancelById}
            onCleanMessage={animation.updateMessage}
            onCleanComplete={finishClean}
            onCleanError={failClean}
            onPetPress={respondToPetTap}
            paused={animation.isPaused}
            petState={animation.visualState}
            petType={settings.petType}
            vetVisit={vet.visit}
            vetLeaving={animation.phase === "finishing"}
            interactionDisabled={restTransitionLocked(animation.restStage) || (!!vet.visit && vet.visit.stage !== "soothe" && vet.visit.stage !== "happy")}
            showConfetti={animation.active?.state === "celebrate"}
            speech={{ name: settings.petName, message: animation.message }}
          />
          <View style={styles.roomHud}>
            <View style={styles.hudLeft}>
              <View style={styles.hudPill}><Text style={styles.hudText}>🔥 {settings.checkinStreak}</Text></View>
              <View style={styles.hudPill}><Text style={styles.hudText}>🪙 {pet.coins}</Text></View>
            </View>
            <Pressable accessibilityHint="Opens all pet wellbeing details" accessibilityLabel={`Open ${settings.petName}'s pet status`} accessibilityRole="button" onPress={() => setShowPetStats(true)} style={({ pressed }) => [styles.hudStatusPill, pressed && styles.statusItemPressed]}><Text style={styles.hudStatusEmoji}>😊</Text><BarChartIcon color={colors.primary} size={15} /></Pressable>
          </View>
        </View>

        {vet.visit && vet.visit.id === animation.active?.id ? <VetClinicControls visit={vet.visit} name={settings.petName} paused={animation.isPaused} onTreat={treatVet} onSoothe={respondToPetTap} onClose={closeVet} /> : null}

        <RestFeedback nativeRest stage={animation.restStage} animationId={animation.active?.id} feedbackKey={animation.restFeedbackKey} wakeReason={animation.restWakeReason} paused={animation.isPaused} />

        {pet.sleepingSince ? <View style={styles.wakePill}><Text style={styles.wakeText}>GENTLE WAKE-UP · {pet.wakeProgress}/2 CHECK-INS</Text></View> : null}

        <View style={styles.carePanel}>
          <View style={styles.careActionRow}>{(["feed", "play", "clean"] as const).map((action) => <CareActionButton disabled={careDisabled} key={action} onPress={() => careForPet(action)} style={[styles.careButton, careDisabled && styles.careButtonDisabled]}><Text style={styles.careEmoji}>{actionInfo[action].emoji}</Text><Text style={styles.careLabel}>{actionInfo[action].label}</Text><Text style={styles.careCost}>{actionInfo[action].detail.replace("coins", "🪙").replace("energy", "⚡")}</Text></CareActionButton>)}</View>
          {showMoreActions ? <View style={styles.moreActions}>
            <CareActionButton disabled={careDisabled || !!animation.restStage} onPress={() => careForPet("rest")} style={[styles.moreActionButton, (careDisabled || !!animation.restStage) && styles.careButtonDisabled]}><Text style={styles.moreActionEmoji}>{actionInfo.rest.emoji}</Text><Text style={styles.moreActionLabel}>{animation.restStage ? "Resting" : "Rest"}</Text><Text style={styles.careCost}>{actionInfo.rest.detail}</Text></CareActionButton>
            <Pressable accessibilityRole="button" disabled={careDisabled} onPress={() => careForPet("vet")} style={({ pressed }) => [styles.moreActionButton, careDisabled && styles.careButtonDisabled, pressed && !careDisabled && styles.careButtonPressed]}><Text style={styles.moreActionEmoji}>{actionInfo.vet.emoji}</Text><Text style={styles.moreActionLabel}>Vet</Text><Text style={styles.careCost}>20 🪙</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={careDisabled || pet.premiumTreats <= 0} onPress={giveSpecialTreat} style={({ pressed }) => [styles.moreActionButton, (careDisabled || pet.premiumTreats <= 0) && styles.careButtonDisabled, pressed && !careDisabled && pet.premiumTreats > 0 && styles.careButtonPressed]}><Text style={styles.moreActionEmoji}>✦</Text><Text numberOfLines={1} style={styles.moreActionLabel}>Special treat</Text><Text style={styles.careCost}>{pet.premiumTreats} available</Text></Pressable>
          </View> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMoreActions }} onPress={() => setShowMoreActions((value) => !value)} style={({ pressed }) => [styles.moreToggle, pressed && styles.moreTogglePressed]}><Text style={styles.moreLabel}>{showMoreActions ? "Fewer actions" : "More actions"}</Text><Text style={styles.moreChevron}>{showMoreActions ? "⌃" : "⌄"}</Text></Pressable>
        </View>
        {!careUnlocked ? <Text style={styles.careHint}>{pet.sleepingSince ? "Complete the gentle wake-up check-ins before playtime." : "Complete today’s money check-in to unlock pet care."}</Text> : null}

        <Button label="Log today’s spending" onPress={() => navigate("transactions")} />
        <Pressable onPress={() => navigate("transactions")} style={({ pressed }) => [styles.progressCard, pressed && styles.pressed]}>
          <View style={styles.progressCopy}>
            <Text style={styles.progressTitle}>{gift ? "A gift is waiting!" : progress >= 3 ? "Today’s gift earned" : `${progress}/3 logs toward today’s gift`}</Text>
            <Text style={styles.progressBody}>{gift ? "Open it to reveal coins, a treat, or a room collectible." : progress >= 3 ? "A fresh three-entry trail begins after midnight." : "Three honest entries today guarantee 10 coins and one mystery gift."}</Text>
            <View style={styles.dots}>{[0, 1, 2].map((index) => <View key={index} style={[styles.dot, (index < progress || !!gift) && styles.dotFilled]} />)}</View>
          </View>
          <GiftBox onPress={claimGift} ready={!!gift && !opening && !animation.isBusy && !animation.restStage} />
        </Pressable>

        <Pressable onPress={() => navigate("insights")} style={({ pressed }) => [styles.safeCard, pressed && styles.pressed]}>
          <View style={styles.safeCopy}>
            <Text style={styles.safeEyebrow}>SAFE TO SPEND TODAY</Text>
            <Text style={styles.safeValue}>{formatMoney(budgetMetrics.safeTodayCents)}</Text>
            <Text style={styles.safeSummary}>{formatMoney(Math.max(0, budgetMetrics.remainingBudgetCents))} left · {budgetMetrics.remainingDays} {budgetMetrics.remainingDays === 1 ? "day" : "days"} remaining</Text>
            <Text style={styles.safeNote}>{budgetMetrics.forwardResetActive ? "Yesterday is recorded. Today’s flexible plan has been recalculated from what remains." : budgetMetrics.reservedCents > 0 ? `After reserving ${formatMoney(budgetMetrics.reservedCents)} for known expenses.` : "Tap to plan categories and future expenses."}</Text>
          </View>
          <Text style={styles.safeArrow}>›</Text>
        </Pressable>
      </Screen>

      <Modal testID="rest-wake-overlay" animationType="none" transparent presentationStyle="overFullScreen" statusBarTranslucent navigationBarTranslucent visible={animation.active?.restNative===true && animation.restStage==="Rest_Loop"} onRequestClose={()=>animation.wakeRest("screenTap")}>
        <Pressable testID="rest-wake-target" style={{flex:1}} accessibilityRole="button" accessibilityLabel={`Sleeping ${settings.petType}. Tap anywhere to wake.`} disabled={animation.isPaused} onPress={()=>animation.wakeRest("screenTap")}/>
      </Modal>
      <Modal animationType="fade" onRequestClose={() => setResult(null)} transparent visible={result !== null}>
        <View style={styles.overlay}>
          <View style={styles.resultSheet}>
            <View style={styles.rewardArt}><View style={styles.rewardHalo} /><ItemArt itemId={result?.itemId ?? (result?.rewardType === "treat" ? "premium_treat" : "mystery_gift")} size={142} /></View>
            <Text style={styles.resultTitle}>{result?.title}</Text>
            <Text style={styles.resultMessage}>{result?.message}</Text>
            {result?.itemId ? <View style={styles.itemTag}><Text style={styles.itemTagText}>{getCollectible(result.itemId)?.rarity} · {getCollectible(result.itemId)?.name}</Text></View> : null}
            {result?.itemId && result.rewardType === "item" ? <Button label="Place it in my room" onPress={equipReward} /> : null}
            <Button label="Keep exploring" onPress={() => setResult(null)} variant="secondary" />
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setShowPetStats(false)} transparent visible={showPetStats}>
        <View style={styles.statsOverlay}>
          <Pressable accessibilityLabel="Close pet status" accessibilityRole="button" onPress={() => setShowPetStats(false)} style={styles.statsBackdrop} />
          <ScrollView contentContainerStyle={styles.statsSheetContent} showsVerticalScrollIndicator={false} style={styles.statsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.statsHeader}>
              <View style={styles.statsHeaderCopy}>
                <Text style={styles.statsEyebrow}>PET STATUS</Text>
                <Text style={styles.statsTitle}>How {settings.petName} feels</Text>
                <Text style={styles.statsSubtitle}>Level {pet.level} · {stageForLevel(pet.level)} · ✦ {pet.xp} XP</Text>
              </View>
              <Pressable accessibilityLabel="Close pet status" accessibilityRole="button" onPress={() => setShowPetStats(false)} style={({ pressed }) => [styles.statsClose, pressed && styles.pressed]}><Text style={styles.statsCloseText}>×</Text></Pressable>
            </View>
            <View style={styles.statsBars}>
              <StatBar label="Fullness" value={100 - pet.hunger} color={colors.secondary} />
              <StatBar label="Happiness" value={pet.happiness} color={colors.yellow} />
              <StatBar label="Energy" value={pet.energy} color={colors.primary} />
              <StatBar label="Cleanliness" value={pet.cleanliness} color="#53A9D8" />
              <StatBar label="Health" value={pet.health} color={colors.green} />
            </View>
            <View style={styles.statsResources}><Text style={styles.statsResource}>⚡ {pet.tokens} care energy</Text><Text style={styles.statsResource}>🪙 {pet.coins} coins</Text></View>
            <Button label="Done" onPress={() => setShowPetStats(false)} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  roomFrame: { height: 400, position: "relative" },
  roomHud: { flexDirection: "row", justifyContent: "space-between", left: 12, position: "absolute", right: 12, top: 12, zIndex: 20 },
  hudLeft: { flexDirection: "row", gap: 7 },
  hudPill: { alignItems: "center", backgroundColor: "rgba(255,255,255,.88)", borderColor: "rgba(255,255,255,.96)", borderRadius: 99, borderWidth: 1, justifyContent: "center", minHeight: 37, minWidth: 43, paddingHorizontal: 11, shadowColor: "#2C2340", shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.18, shadowRadius: 7 },
  hudText: { color: "#29233A", fontSize: 13, fontWeight: "900" },
  hudStatusPill: { alignItems: "center", backgroundColor: "rgba(255,255,255,.9)", borderColor: "rgba(255,255,255,.98)", borderRadius: 99, borderWidth: 1, flexDirection: "row", gap: 5, height: 37, justifyContent: "center", paddingHorizontal: 10, shadowColor: "#2C2340", shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.18, shadowRadius: 7 },
  hudStatusEmoji: { fontSize: 18 },
  wakePill: { alignSelf: "center", backgroundColor: colors.primarySoft, borderColor: colors.purpleBorder, borderRadius: 99, borderWidth: 1, marginTop: -2, paddingHorizontal: 13, paddingVertical: 7 },
  wakeText: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  statusItemPressed: { opacity: 0.58 },
  carePanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 7, padding: 8 },
  careActionRow: { flexDirection: "row", gap: 7 },
  careButton: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 60, paddingHorizontal: 4, paddingVertical: 7 },
  careButtonDisabled: { opacity: 0.42 },
  careButtonPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  careEmoji: { fontSize: 18 },
  careLabel: { color: colors.text, fontSize: 11, fontWeight: "900", marginTop: 2 },
  careCost: { color: colors.muted, fontSize: 8, fontWeight: "800", marginTop: 1 },
  moreToggle: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "center", minHeight: 38, paddingTop: 5 },
  moreTogglePressed: { opacity: 0.62 },
  moreLabel: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  moreChevron: { color: colors.primary, fontSize: 17, fontWeight: "900", marginLeft: 7 },
  moreActions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  moreActionButton: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexBasis: "31%", flexGrow: 1, justifyContent: "center", minHeight: 82, paddingHorizontal: 4, paddingVertical: 7 },
  moreActionEmoji: { fontSize: 18 },
  moreActionLabel: { color: colors.text, fontSize: 10, fontWeight: "900" },
  careHint: { color: colors.muted, fontSize: 10, marginTop: -9, textAlign: "center" },
  progressCard: { alignItems: "center", backgroundColor: colors.yellowSoft, borderColor: colors.yellowBorder, borderRadius: 20, borderWidth: 1, flexDirection: "row", minHeight: 130, padding: spacing.md },
  progressCopy: { flex: 1, paddingRight: spacing.sm },
  progressTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  progressBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  dots: { flexDirection: "row", gap: 7, marginTop: 12 },
  dot: { backgroundColor: colors.track, borderRadius: 6, height: 9, width: 32 },
  dotFilled: { backgroundColor: colors.secondary },
  gift: { alignItems: "center", height: 86, justifyContent: "center", opacity: 0.5, width: 84 },
  giftReady: { opacity: 1 },
  giftGlow: { backgroundColor: "rgba(255,255,255,.68)", borderRadius: 99, height: 70, position: "absolute", width: 70 },
  giftLabel: { backgroundColor: "rgba(47,39,59,.78)", borderRadius: 99, bottom: 0, color: "#FFFFFF", fontSize: 7, fontWeight: "900", letterSpacing: 0.8, paddingHorizontal: 7, paddingVertical: 3, position: "absolute" },
  safeCard: { alignItems: "center", backgroundColor: colors.purpleSoft, borderColor: colors.purpleBorder, borderRadius: 20, borderWidth: 1, flexDirection: "row", padding: spacing.md },
  safeCopy: { flex: 1 }, safeEyebrow: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 }, safeValue: { color: colors.text, fontSize: 27, fontWeight: "900", marginTop: 4 }, safeSummary: { color: colors.text, fontSize: 12, fontWeight: "800", marginTop: 2 }, safeNote: { color: colors.muted, fontSize: 10, marginTop: 5 }, safeArrow: { color: colors.primary, fontSize: 32, fontWeight: "500", marginLeft: 8 },
  pressed: { opacity: 0.75 },
  overlay: { alignItems: "center", backgroundColor: "rgba(37,28,53,.5)", flex: 1, justifyContent: "center", padding: spacing.lg },
  resultSheet: { alignItems: "stretch", backgroundColor: colors.surface, borderRadius: 26, gap: spacing.sm, padding: spacing.lg, width: "100%" },
  rewardArt: { alignItems: "center", height: 142, justifyContent: "center" },
  rewardHalo: { backgroundColor: "#FFF2CE", borderRadius: 70, height: 126, position: "absolute", width: 126 },
  resultTitle: { color: colors.text, fontSize: 25, fontWeight: "900", textAlign: "center" },
  resultMessage: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.xs, textAlign: "center" },
  itemTag: { alignSelf: "center", backgroundColor: colors.primarySoft, borderRadius: 99, marginBottom: spacing.xs, paddingHorizontal: 12, paddingVertical: 7 },
  itemTagText: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  statsOverlay: { flex: 1, justifyContent: "flex-end" },
  statsBackdrop: { backgroundColor: "rgba(37,28,53,.5)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  statsSheet: { backgroundColor: colors.surface, borderColor: colors.border, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, flexGrow: 0, maxHeight: "92%" },
  statsSheetContent: { gap: spacing.md, paddingBottom: 18, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  sheetHandle: { alignSelf: "center", backgroundColor: colors.track, borderRadius: 99, height: 5, marginBottom: spacing.xs, width: 44 },
  statsHeader: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  statsHeaderCopy: { flex: 1 },
  statsEyebrow: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  statsTitle: { color: colors.text, fontSize: 24, fontWeight: "900", marginTop: 3 },
  statsSubtitle: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 4 },
  statsClose: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderRadius: 99, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  statsCloseText: { color: colors.text, fontSize: 25, fontWeight: "500", lineHeight: 28 },
  statsBars: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  statsResources: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  statsResource: { backgroundColor: colors.primarySoft, borderColor: colors.purpleBorder, borderRadius: 99, borderWidth: 1, color: colors.text, fontSize: 11, fontWeight: "800", paddingHorizontal: 11, paddingVertical: 7 },
});
