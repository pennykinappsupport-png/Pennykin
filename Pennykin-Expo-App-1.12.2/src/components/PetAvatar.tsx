import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { CAT_CARE_ATLAS, CAT_LICK_IMAGE, CAT_VET_ATLAS, CAT_PLAY_CLEAN_ATLAS, PET_BLINK_IMAGES, PET_EAT_IMAGES, PET_IMAGES, PET_REST_IMAGES } from "../petImages";
import { canIdleFidget, catCareFrame, petCareFrame, feedBowlIsEmbedded, FEED_BODY_SPRING, FEED_BOWL_SPRING, FEED_GROOM_SPRING, FEED_CHEW_MS, FEED_PREP_SQUASH_MS, FEED_REACH_AT, FEED_REACH_MS, FEED_TAKE_MS, FEED_EAT_AT, FEED_EAT_MS, FEED_GROOM_AT, FEED_GROOM_MS, FEED_VISUAL_MS } from "../careChoreography";
import { canPetBlink, selectPetFrame, type PetPose } from "../petPose";
import type { PetType, PetVisualState } from "../types";
import { ItemArt } from "./ItemArt";
import { PetFaceFrame } from "./PetFaceFrame";
import { CatCareArt } from "./CatCareArt";
import { PetCareArt } from "./PetCareArt";
import { FoodBowl } from "./FoodBowl";
import { PetIdleArt } from "./PetIdleArt";
import { FeedEyeGlints } from "./FeedEyeGlints";
import { CatVetArt } from "./CatVetArt";
import { VetPetEffects } from "./VetPetEffects";
import type { VetVisit } from "../vetVisit";
import { playRigTransform, usePlayMotion } from "./usePlayMotion";
import { CatPlayArt } from "./CatPlayArt";
import { AnimalPlayArt } from "./AnimalPlayArt";
import { AnimalPlayEffects } from "./AnimalPlayEffects";
import { PlayEffects } from "./PlayEffects";
import type { RestStage } from "../restChoreography";
import { NativeRestArt } from "./NativeRestArt";
import { feedBowlOpacity, feedBowlTransform, feedRigTransform, useFeedMotion } from "./useFeedMotion";
import { FeedArt } from "./FeedArt";
import type { FeedVisualValues } from "../feedTimeline";
import { sleepArtStyle } from "../sleepArtLayout";
import { CleanArt } from "./CleanArt";
import { useCleanMotion } from "./useCleanMotion";

type Props = {
  type: PetType;
  restStage?: RestStage | null;
  restFeedbackKey?: number;
  onRestStageFinished?: (id:string,stage:RestStage)=>void;
  onRestError?: (id:string)=>void;
  size?: number;
  state?: PetVisualState;
  outfit?: string;
  onPress?: () => void;
  interactionDisabled?: boolean;
  paused?: boolean;
  animationKey?: string;
  vetVisit?: VetVisit | null;
  onPlayMessage?: (id: string, message: string) => void;
  playProgress?: Animated.Value;
  feedProgress?: Animated.Value;
  feedVisuals?: FeedVisualValues<Animated.Value>;
  onFeedComplete?: (id: string) => void;
  onFeedError?: (id: string) => void;
  cleanProgress?: Animated.Value;
  onCleanMessage?: (id: string, message: string) => void;
  onCleanComplete?: (id: string) => void;
  onCleanError?: (id: string) => void;
};

const loadedPetTypes = new Set<PetType>();
const loadedPetPoses = new Set<string>();
let catCareAtlasLoaded = false;
const loadedCareTypes = new Set<PetType>();
let catLickLoaded = false;
let catVetLoaded = false;
let catPlayLoaded = false;
const loadedAnimalPlayTypes = new Set<PetType>();

export function PetAvatar(props: Props) {
  // Keep decoded image views resident across taps and actions. Timeline
  // cleanup resets motion; only changing the pet species remounts the art.
  return <PetAvatarScene key={props.type} {...props} />;
}

function useAnimationThreshold(value: Animated.Value, threshold: number, enabled: boolean, scope: string) {
  const [frame, setFrame] = useState({ scope, reached: false });
  useEffect(() => {
    setFrame({ scope, reached: false });
    if (!enabled) return;
    let active = true;
    let previous = false;
    const id = value.addListener(({ value: current }) => {
      if (!active) return;
      const next = current >= threshold;
      if (next !== previous) {
        previous = next;
        setFrame({ scope, reached: next });
      }
    });
    return () => {
      active = false;
      value.removeListener(id);
    };
  }, [enabled, scope, threshold, value]);
  return enabled && frame.scope === scope && frame.reached;
}

function PetAvatarScene({ restStage = null, restFeedbackKey = 0, type, size = 190, state = "calm", outfit, onPress, interactionDisabled = false, paused = false, animationKey, vetVisit, onPlayMessage, playProgress, feedProgress, feedVisuals, onFeedComplete, onFeedError, cleanProgress, onCleanMessage, onCleanComplete, onCleanError, onRestStageFinished, onRestError }: Props) {
  const breath = useRef(new Animated.Value(0)).current;
  const tapLift = useRef(new Animated.Value(0)).current;
  const tapTilt = useRef(new Animated.Value(0)).current;
  const activity = useRef(new Animated.Value(0)).current;
  const chew = useRef(new Animated.Value(0)).current;
  const feedSquash = useRef(new Animated.Value(0)).current;
  const bowlArrival = useRef(new Animated.Value(0)).current;
  const bowlTravel = useRef(new Animated.Value(0)).current;
  const feedGroom = useRef(new Animated.Value(0)).current;
  const vetShiver = useRef(new Animated.Value(0)).current;
  const vetRelief = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(0)).current;
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapMotion = useRef<Animated.CompositeAnimation | null>(null);
  const frameScope = `${state}:${animationKey ?? "idle"}`;
  const blinkClosed = useAnimationThreshold(blink, 0.5, canPetBlink(state), frameScope);
  const chewing = useAnimationThreshold(chew, 0.5, state === "eating", frameScope);
  const play = usePlayMotion(state === "playing", animationKey, paused, onPlayMessage, playProgress, type);
  const feedLoadedLayers = useRef(new Set<number>()).current;
  const [feedArtReady, setFeedArtReady] = useState(false);
  const [feedArtFailed, setFeedArtFailed] = useState(false);
  useEffect(() => {
    if (state === "eating" && feedArtFailed && animationKey) onFeedError?.(animationKey);
  }, [state, feedArtFailed, animationKey, onFeedError]);
  const petFeed = useFeedMotion(state === "eating" && feedArtReady, animationKey, paused, feedProgress, feedVisuals, onFeedComplete);
  const feedingClock = petFeed.progress;

  const feedReaching = useAnimationThreshold(activity, FEED_REACH_AT, state === "eating", frameScope);
  const feedEating = useAnimationThreshold(activity, FEED_EAT_AT, state === "eating", frameScope);
  const feedGrooming = useAnimationThreshold(activity, FEED_GROOM_AT, state === "eating", frameScope);
  const feedBlinkStarted = useAnimationThreshold(activity, 0.06, state === "eating", frameScope);
  const feedBlinkEnded = useAnimationThreshold(activity, 0.12, state === "eating", frameScope);
  const wipeStarted = false, wipeEnded = false;
  const nativeRest = !!restStage;
  const [careReady, setCareReady] = useState(type === "cat" ? catCareAtlasLoaded : loadedCareTypes.has(type));
  const [lickReady, setLickReady] = useState(catLickLoaded);
  const [vetReady, setVetReady] = useState(catVetLoaded);
  const [animalPlayReady, setAnimalPlayReady] = useState(loadedAnimalPlayTypes.has(type));
  const [playReady, setPlayReady] = useState(catPlayLoaded);
  const [loaded, setLoaded] = useState(() => loadedPetTypes.has(type));
  const [retryKey, setRetryKey] = useState(0);
  const [cleanArtReady, setCleanArtReady] = useState(false);
  const [cleanArtFailed, setCleanArtFailed] = useState(false);
  const clean = useCleanMotion(state === "bathing" && loaded && cleanArtReady && !cleanArtFailed,
    animationKey, paused, cleanProgress, onCleanMessage, onCleanComplete);
  useEffect(() => {
    if (state === "bathing" && cleanArtFailed && animationKey) onCleanError?.(animationKey);
  }, [state, cleanArtFailed, animationKey, onCleanError]);
  const [poseReady, setPoseReady] = useState(() => ({
    blink: loadedPetPoses.has(`${type}:blink`),
    eat: loadedPetPoses.has(`${type}:eat`),
    play: loadedPetPoses.has(`${type}:play`),
    rest: loadedPetPoses.has(`${type}:rest`),
  }));

  useEffect(() => {
    setLoaded(loadedPetTypes.has(type));
    setPoseReady({
      blink: loadedPetPoses.has(`${type}:blink`),
      eat: loadedPetPoses.has(`${type}:eat`),
      play: loadedPetPoses.has(`${type}:play`),
      rest: loadedPetPoses.has(`${type}:rest`),
    });
    setRetryKey(0);
  }, [type]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    if (blinkTimer.current) clearTimeout(blinkTimer.current);
    tapMotion.current?.stop();
    tapLift.stopAnimation();
    tapTilt.stopAnimation();
  }, [tapLift, tapTilt]);

  useLayoutEffect(() => {
    if (paused || interactionDisabled || state === "playing" || state === "bathing") {
      tapMotion.current?.stop();
      tapLift.setValue(0);
      tapTilt.setValue(0);
    }
  }, [interactionDisabled, paused, state, tapLift, tapTilt]);

  useEffect(() => {
    vetShiver.stopAnimation(); vetShiver.setValue(0);
    if (paused || state !== "vet" || (vetVisit?.stage !== "checking" && vetVisit?.stage !== "treat")) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(vetShiver, { duration: 80, toValue: 0.8, useNativeDriver: true }),
      Animated.timing(vetShiver, { duration: 100, toValue: -0.8, useNativeDriver: true }),
      Animated.timing(vetShiver, { duration: 100, toValue: 0, useNativeDriver: true }),
      Animated.delay(700),
    ]));
    loop.start();
    return () => { loop.stop(); vetShiver.stopAnimation(); vetShiver.setValue(0); };
  }, [paused, state, vetShiver, vetVisit?.stage]);

  useEffect(() => {
    vetRelief.stopAnimation();
    if (state !== "vet" || vetVisit?.stage !== "happy") { vetRelief.setValue(0); return; }
    if (paused) return;
    const spring = Animated.spring(vetRelief, { toValue: 1, damping: 10, stiffness: 150, mass: 0.6, useNativeDriver: true });
    spring.start();
    return () => spring.stop();
  }, [paused, state, vetRelief, vetVisit?.stage]);

  useEffect(() => {
    breath.stopAnimation();
    if (paused || nativeRest) {
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { duration: state === "sleeping" ? 1900 : 1550, toValue: 1, useNativeDriver: true }),
      Animated.timing(breath, { duration: state === "sleeping" ? 1900 : 1550, toValue: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breath, paused, state, nativeRest]);

  useEffect(() => {
    let active = true;
    let blinkSequence: Animated.CompositeAnimation | null = null;
    const schedule = () => {
      if (!active || paused || !canPetBlink(state)) return;
      blinkTimer.current = setTimeout(() => {
        if (!active) return;
        blinkSequence = Animated.sequence([
          Animated.timing(blink, { duration: 65, toValue: 1, useNativeDriver: true }),
          Animated.delay(115),
          Animated.timing(blink, { duration: 80, toValue: 0, useNativeDriver: true }),
        ]);
        blinkSequence.start(({ finished }) => { if (finished && active) schedule(); });
      }, 2800 + Math.floor(Math.random() * 3200));
    };
    if (!paused && canPetBlink(state)) schedule();
    return () => {
      active = false;
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      blinkSequence?.stop();
      blink.stopAnimation();
      blink.setValue(0);
    };
  }, [animationKey, blink, paused, state]);

  useLayoutEffect(() => {
    activity.stopAnimation();
    chew.stopAnimation();
    activity.setValue(0);
    chew.setValue(0);
    const feedValues = [feedSquash, bowlArrival, bowlTravel, feedGroom];
    feedValues.forEach((value) => { value.stopAnimation(); value.setValue(0); });
    if (paused) return;
    // Feed has one shared native clock for poses, body, bowl and speech.
    if (state === "eating") return;
    // Play has its own pause-preserving shared clock; never run a second body loop.
    if (state === "playing" || state === "bathing" || nativeRest) return;
    if (["gift", "saving"].includes(state)) {
      const forwardDuration = 900;
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(activity, { duration: forwardDuration, toValue: 1, useNativeDriver: true }),
        Animated.timing(activity, { duration: 420, toValue: 0, useNativeDriver: true }),
        Animated.delay(80),
      ]));
      loop.start();
      return () => loop.stop();
    }
    if (["celebrate", "waking", "sleeping"].includes(state)) {
      const duration = state === "sleeping" ? 1800 : 330;
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(activity, { duration, toValue: 1, useNativeDriver: true }),
        Animated.timing(activity, { duration, toValue: 0, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [activity, animationKey, bowlArrival, bowlTravel, chew, feedGroom, feedSquash, paused, state, type, nativeRest]);

  const reactToTap = () => {
    if (interactionDisabled || paused) return;
    // Keep the automatic Play story intact. The owner may defer this hello,
    // but an immediate tap bounce must not move the toy and body a second time.
    if (state === "playing" || state === "bathing" || restStage) { onPress?.(); return; }
    if (!loaded) {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      setRetryKey((value) => value + 1);
    }
    tapMotion.current?.stop();
    tapMotion.current = Animated.parallel([
      Animated.sequence([
        Animated.spring(tapLift, { friction: 4, tension: 120, toValue: -13, useNativeDriver: true }),
        Animated.spring(tapLift, { friction: 6, tension: 95, toValue: 0, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(tapTilt, { duration: 100, toValue: 1, useNativeDriver: true }),
        Animated.timing(tapTilt, { duration: 110, toValue: -1, useNativeDriver: true }),
        Animated.spring(tapTilt, { friction: 5, tension: 90, toValue: 0, useNativeDriver: true }),
      ]),
    ]);
    tapMotion.current.start();
    onPress?.();
  };

  const slowRestBreath = state === "sleeping" && (!restStage || restStage === "Rest_Loop");
  const breathX = breath.interpolate({ inputRange: [0, 1], outputRange: [1, slowRestBreath ? 1.025 : 1.008] });
  const breathY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, slowRestBreath ? 1.045 : 1.018] });
  const tapRotate = tapTilt.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-5deg", "0deg", "5deg"] });
  const activityY = activity.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: state === "playing" || nativeRest ? [0, 0, 0, 0, 0] : state === "celebrate" ? [0, -15, 0, -12, 0] : state === "bathing" ? [0, 0, 0, 0, 0] : state === "sleeping" ? [0, 1, 2, 1, 0] : state === "eating" ? [0, 0, 0, 0, 0] : [0, 2, 4, 2, 0],
  });
  const activityX = activity.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [0, 0, 0, 0, 0],
  });
  const activityRotate = activity.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: state === "playing" ? ["0deg", "0deg", "0deg", "0deg", "0deg"] : state === "celebrate" ? ["0deg", "-4deg", "0deg", "4deg", "0deg"] : ["0deg", "0deg", "0deg", "0deg", "0deg"],
  });
  const frame = loaded ? selectPetFrame(state, poseReady, { blinkClosed, chewing, toyCaught: play.caught }) : { body: "base" as const, face: null };
  const idleVisible = loaded && !nativeRest && frame.body === "base" && canIdleFidget(state, !!animationKey);
  const careFrame = state === "eating" || state === "bathing" ? null : type === "cat"
    ? catCareFrame(state, loaded && careReady, { reaching: feedReaching, eating: feedEating, grooming: feedGrooming, wipeStarted, wipeEnded }, lickReady)
    : petCareFrame(state, loaded && careReady, { reaching: false, eating: false, satisfied: false, licking: false, wipeStarted, wipeEnded });
  const showClean = state === "bathing" && loaded && cleanArtReady && !cleanArtFailed && clean.ready && !clean.complete;
  const showFeed = state === "eating" && feedArtReady;
  const showAnimalPlay = type !== "cat" && state === "playing" && loaded && animalPlayReady && play.ready && !play.complete;
  const showPlay = showAnimalPlay || (state === "playing" && loaded && type === "cat" && playReady && play.pose !== null);
  const playTransform = state === "playing" ? playRigTransform(play.progress, size, type) : [];
  const showRest = nativeRest;
  const showVet = state === "vet" && !!vetVisit && loaded && type === "cat" && vetReady;
  const expectingFeed = state === "eating" && petFeed.expecting;
  const expectationBlink = expectingFeed && poseReady.blink && petFeed.blinking;
  const feedTransform = showFeed ? feedRigTransform(petFeed.progress, size, petFeed.visuals.pickupScale) : [];
  const poseImages = { base: PET_IMAGES[type], blink: PET_BLINK_IMAGES[type], rest: PET_REST_IMAGES[type], eat: PET_EAT_IMAGES[type] };
  const markPoseLoaded = (name: PetPose) => {
    if (name === "base") {
      loadedPetTypes.add(type);
      setLoaded(true);
    } else {
      loadedPetPoses.add(`${type}:${name}`);
      setPoseReady((current) => current[name] ? current : { ...current, [name]: true });
    }
  };
  const markPoseFailed = (name: PetPose) => {
    if (name === "base") {
      loadedPetTypes.delete(type);
      setLoaded(false);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (retryKey < 2) retryTimer.current = setTimeout(() => setRetryKey((value) => value + 1), 700 + retryKey * 500);
    } else {
      loadedPetPoses.delete(`${type}:${name}`);
      setPoseReady((current) => ({ ...current, [name]: false }));
    }
  };
  const hideOutfit = state === "sleeping" || state === "bathing" || state === "playing" || state === "eating" || state === "vet";

  return (
    <Pressable accessibilityLabel={restStage === "Rest_Loop" ? "Sleeping pet. Tap anywhere to wake." : "Tap your pet"} accessibilityRole="button" disabled={interactionDisabled || paused} hitSlop={12} onPress={reactToTap}>
      <Animated.View style={{ height: size, transform: [{ translateY: tapLift }, { translateY: activityY }, { translateY: chew.interpolate({ inputRange: [0, 1], outputRange: [0, 1.6] }) }, { translateX: activityX }, { translateX: vetShiver }, { scale: state === "vet" && vetVisit?.stage === "happy" ? vetRelief.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0.97, 1.04, 1] }) : 1 }, { scaleX: state === "playing" || state === "bathing" || nativeRest ? 1 : breathX }, { scaleY: state === "playing" || state === "bathing" || nativeRest ? 1 : breathY }, { rotate: activityRotate }, { rotate: tapRotate }], width: size }}>
        <Animated.View style={[styles.petLayer, { height: size, transformOrigin: restStage || state === "eating" || state === "playing" ? "50% 97%" : "50% 50%", transform: [...playTransform, ...feedTransform, { scaleX: feedSquash.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.96, 1, 1.055] }) }, { scaleY: feedSquash.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.09, 1, 0.91] }) }], width: size }]}> 
          {!loaded && !nativeRest ? <PetFallback size={size} type={type} /> : null}
          {/* Preload facial source art; visible eye/mouth frames stay mounted. */}
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.posePreloader}>
            {(["blink", "eat"] as const).map((name) => <Image key={`${name}:${retryKey}`} fadeDuration={0} onError={() => markPoseFailed(name)} onLoad={() => markPoseLoaded(name)} source={poseImages[name]} style={styles.preloadImage} />)}
            {type === "cat" ? <Image source={CAT_CARE_ATLAS} style={styles.preloadImage} onLoad={() => { catCareAtlasLoaded = true; setCareReady(true); }} onError={() => { catCareAtlasLoaded = false; setCareReady(false); setFeedArtFailed(true); }} /> : null}
            {type === "cat" ? <Image source={CAT_LICK_IMAGE} style={styles.preloadImage} onLoad={() => { catLickLoaded = true; setLickReady(true); }} onError={() => { catLickLoaded = false; setLickReady(false); }} /> : null}
            {type === "cat" ? <Image source={CAT_VET_ATLAS} style={styles.preloadImage} onLoad={() => { catVetLoaded = true; setVetReady(true); }} onError={() => { catVetLoaded = false; setVetReady(false); }} /> : null}
            {type === "cat" ? <Image source={CAT_PLAY_CLEAN_ATLAS} fadeDuration={0} style={styles.preloadImage} onLoad={() => { catPlayLoaded = true; setPlayReady(true); }} onError={() => { catPlayLoaded = false; setPlayReady(false); }} /> : null}
          </View>
          {/* Resident images use only static visibility, never native-driven
              opacity or keys that change with each facial frame. */}
          {(["base", "rest"] as const).map((name) => <Image
            fadeDuration={0}
            key={`${name}:${retryKey}`}
            onError={() => markPoseFailed(name)}
            onLoad={() => markPoseLoaded(name)}
            resizeMode="contain"
            source={poseImages[name]}
            style={[styles.petImage, { height: size, opacity: loaded && frame.body === name && careFrame === null && !showFeed && !showClean && !showVet && !showPlay && !showRest && !(name === "base" && idleVisible) ? 1 : 0, width: size }, name === "rest" ? sleepArtStyle(type, size) : {}]}
          />)}
          <NativeRestArt type={type} size={size} stage={restStage} runId={animationKey} paused={paused} onStageFinished={onRestStageFinished} onError={onRestError}/>
          {type === "cat" ? <CatPlayArt size={size} pose={showPlay ? play.pose : null} /> : null}
          {type !== "cat" ? <AnimalPlayArt type={type} size={size} progress={play.progress} visible={showAnimalPlay}
            onReady={() => { loadedAnimalPlayTypes.add(type); setAnimalPlayReady(true); }}
            onError={() => { loadedAnimalPlayTypes.delete(type); setAnimalPlayReady(false); }} /> : null}
          {cleanProgress !== undefined || state === "bathing" ? <CleanArt type={type} size={size} visible={showClean} paused={paused} runId={animationKey} onFinished={clean.finish} getProgress={clean.getProgress}
            onReady={() => { setCleanArtReady(true); setCleanArtFailed(false); }}
            onError={() => { setCleanArtReady(false); setCleanArtFailed(true); }} /> : null}
          <PetIdleArt type={type} size={size} visible={idleVisible} paused={paused} />
          <FeedArt type={type} size={size} visuals={petFeed.visuals} onLayerError={() => setFeedArtFailed(true)} onLayerLoad={(index) => {
            feedLoadedLayers.add(index);
            if (feedLoadedLayers.size === 5) { setFeedArtReady(true); setFeedArtFailed(false); }
          }} />
          {type === "cat" ? <CatCareArt size={size} frame={careFrame} progress={activity} grooming={feedGroom} /> : null}
          {type !== "cat" ? <PetCareArt type={type} size={size} frame={careFrame} progress={activity} grooming={feedGroom}
            onReady={() => { loadedCareTypes.add(type); setCareReady(true); }}
            onError={() => { loadedCareTypes.delete(type); setCareReady(false); }} /> : null}
          {type === "cat" ? <CatVetArt size={size} visible={showVet} happy={vetVisit?.stage === "happy"} /> : null}
          <PetFaceFrame type={type} size={size} frame="blink" visible={loaded && careFrame === null && !showVet && !showPlay && !showClean && !showRest && (frame.face === "blink" || expectationBlink)} />
          <PetFaceFrame type={type} size={size} frame="eat" visible={loaded && careFrame === null && !showFeed && !showClean && !showVet && !showPlay && !showRest && frame.face === "eat"} />
          <FeedEyeGlints type={type} size={size} visible={loaded && expectingFeed && !expectationBlink} glow={petFeed.progress.interpolate({ inputRange: [0, 0.05, 0.16, FEED_REACH_AT, 1], outputRange: [0, 1, 1, 0, 0], extrapolate: "clamp" })} />

          {!hideOutfit && outfit === "lavender_scarf" ? <ItemArt itemId="lavender_scarf" size={size * 0.44} style={[styles.outfit, { left: size * 0.29, top: size * 0.48, transform: [{ rotate: "7deg" }] }]} /> : null}
          {!hideOutfit && outfit === "gold_crown" ? <ItemArt itemId="gold_crown" size={size * 0.34} style={[styles.outfit, { left: size * 0.34, top: -size * 0.01 }]} /> : null}
        </Animated.View>

        {state === "vet" && vetVisit ? <VetPetEffects size={size} visit={vetVisit} paused={paused} /> : null}

        {state === "eating" ? (
          <>
            {/* Static parent visibility never competes with native opacity.
                Dog/rabbit props are removed completely at their retirement. */}
            {petFeed.bowlVisible ? <View pointerEvents="none"><Animated.View style={[styles.actionProp, {
              left: size * 0.84, top: size * 0.53,
              opacity: feedBowlOpacity(petFeed.progress),
              transform: feedBowlTransform(petFeed.progress, size),
            }]}><FoodBowl type={type} size={size * 0.29} /></Animated.View></View> : null}
            <Animated.Text style={[styles.crumbs, { opacity: feedingClock.interpolate({ inputRange: [0, FEED_EAT_AT, FEED_GROOM_AT - 0.04, FEED_GROOM_AT, 1], outputRange: [0, 0, 1, 0, 0] }), right: size * 0.22, top: size * 0.42 }]}>•  •</Animated.Text>
          </>
        ) : null}
        {state === "playing" && type === "cat" ? <PlayEffects size={size} progress={play.progress} visible={play.ready && !play.complete} pose={showPlay ? play.pose : null} /> : null}
        {state === "playing" && type !== "cat" ? <AnimalPlayEffects type={type} size={size} progress={play.progress} visible={play.ready && !play.complete} artworkReady={animalPlayReady} /> : null}
        {state === "gift" ? <Animated.View style={[styles.actionProp, { bottom: -size * 0.01, right: -size * 0.03, transform: [{ rotate: activity.interpolate({ inputRange: [0, 0.35, 0.7, 1], outputRange: ["-5deg", "5deg", "-4deg", "4deg"] }) }, { scale: activity.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1.08, 0.94] }) }] }]}><ItemArt itemId="mystery_gift" size={size * 0.35} /></Animated.View> : null}

        {state === "sleeping" && !restStage ? <Animated.Text style={[styles.stateMark, { fontSize: size * 0.12, opacity: activity.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), right: 4, top: size * 0.17, transform: [{ translateY: activity.interpolate({ inputRange: [0, 1], outputRange: [8, -8] }) }] }]}>Zzz</Animated.Text> : null}
        {state === "celebrate" || state === "waking" ? <Animated.Text style={[styles.stateMark, styles.sparkle, { fontSize: size * 0.15, opacity: activity, right: 0, top: size * 0.12, transform: [{ scale: activity.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }] }]}>✦</Animated.Text> : null}
        {state === "saving" ? <Animated.Text style={[styles.stateMark, styles.coin, { fontSize: size * 0.13, opacity: activity, right: size * 0.02, top: size * 0.2, transform: [{ translateY: activity.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.18] }) }] }]}>●</Animated.Text> : null}
      </Animated.View>
    </Pressable>
  );
}

function PetFallback({ size, type }: { size: number; type: PetType }) {
  const face = type === "dog" ? "🐶" : type === "rabbit" ? "🐰" : "🐱";
  return (
    <View accessibilityLabel="Pet artwork is loading" style={[styles.fallback, { height: size, width: size }]}>
      <View style={[styles.fallbackHalo, { height: size * 0.7, width: size * 0.7 }]} />
      <Text style={{ fontSize: size * 0.48 }}>{face}</Text>
      <View style={styles.loadingPill}><Text style={[styles.loadingDots, { fontSize: Math.max(8, size * 0.055) }]}>WAKING UP · TAP TO RETRY</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionProp: { position: "absolute", zIndex: 6 },
  coin: { color: "#E5A62E" },
  crumbs: { color: "#B97742", fontSize: 12, fontWeight: "900", position: "absolute", zIndex: 8 },
  fallback: { alignItems: "center", justifyContent: "center", position: "absolute" },
  fallbackHalo: { backgroundColor: "rgba(255,248,229,.9)", borderColor: "rgba(112,92,166,.18)", borderRadius: 999, borderWidth: 2, position: "absolute" },
  loadingDots: { color: "#7160B5", fontWeight: "900", letterSpacing: 0.5 },
  loadingPill: { backgroundColor: "rgba(255,255,255,.92)", borderRadius: 99, bottom: "5%", paddingHorizontal: 8, paddingVertical: 4, position: "absolute" },
  outfit: { position: "absolute", zIndex: 5 },
  petLayer: { left: 0, position: "absolute", top: 0, zIndex: 3 },
  petImage: { left: 0, position: "absolute", top: 0 },
  posePreloader: { height: 1, opacity: 0, overflow: "hidden", position: "absolute", width: 1 },
  preloadImage: { height: 1, position: "absolute", width: 1 },
  sparkle: { color: "#F0B93B" },
  stateMark: { color: "#7160B5", fontWeight: "900", position: "absolute", zIndex: 8 },
});
