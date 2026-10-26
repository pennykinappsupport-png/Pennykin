import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { getCollectible } from "../collectibles";
import { AppText } from "../display";
import { colors } from "../theme";
import type { PetType, PetVisualState, RoomSlot } from "../types";
import { ItemArt } from "./ItemArt";
import { PetAvatar } from "./PetAvatar";
import { ClinicBackdrop } from "./VetClinic";
import type { VetVisit } from "../vetVisit";
import type { RestStage } from "../restChoreography";
import { PLAY_INPUT, PLAY_SPEECH_OPACITY, PLAY_VISUAL_MS, PLAY_SPEECH_DELAY_MS } from "../playChoreography";
import { ANIMAL_PLAY_VISUAL_MS, ANIMAL_PLAY_INPUT } from "../animalPlayChoreography";
import { playSpeechOpacity } from "../playChoreography";
import { createFeedVisuals } from "./useFeedMotion";
import { CLEAN_INPUT, CLEAN_SPEECH_OPACITY, CLEAN_SCENE_PATH } from "../cleanChoreography";

type Props = {
  petType: PetType;
  restStage?: RestStage | null;
  restFeedbackKey?: number;
  onRestStageFinished?: (id:string,stage:RestStage)=>void;
  onRestError?: (id:string)=>void;
  allowNightSleep?: boolean;
  equipment: Partial<Record<RoomSlot, string>>;
  previewItemId?: string;
  goalPercent?: number;
  petState?: PetVisualState;
  onPetPress?: () => void;
  height?: number;
  showConfetti?: boolean;
  interactionDisabled?: boolean;
  paused?: boolean;
  animationKey?: string;
  animateArrival?: boolean;
  speech?: { name: string; message: string };
  vetVisit?: VetVisit | null;
  vetLeaving?: boolean;
  onPlayMessage?: (id: string, message: string) => void;
  onFeedComplete?: (id: string) => void;
  onFeedError?: (id: string) => void;
  onCleanMessage?: (id: string, message: string) => void;
  onCleanComplete?: (id: string) => void;
  onCleanError?: (id: string) => void;
};

const WALLS: Record<string, string> = {
  lavender_wall: "#E9E1F4",
  sunset_wall: "#F8D8C7",
  mint_wall: "#D8E9DA",
  midnight_wall: "#30345D",
};

function WallpaperDetails({ id, dark }: { id?: string; dark: boolean }) {
  if (id === "sunset_wall") {
    return <><View style={[styles.wallCloud, styles.cloudOne]} /><View style={[styles.wallCloud, styles.cloudTwo]} /><View style={styles.sunsetDisc} /></>;
  }
  if (id === "mint_wall") {
    return <><Text style={[styles.wallSprig, styles.sprigOne]}>❧</Text><Text style={[styles.wallSprig, styles.sprigTwo]}>❧</Text><Text style={[styles.wallSprig, styles.sprigThree]}>❧</Text></>;
  }
  if (id === "midnight_wall") {
    return <><Text style={[styles.wallStars, styles.starsOne]}>✦ · ･ ✧</Text><Text style={[styles.wallStars, styles.starsTwo]}>· ✧ ･ ✦</Text><View style={styles.wallMoon} /></>;
  }
  return <><Text style={[styles.lavenderStem, styles.lavenderOne]}>⌁</Text><Text style={[styles.lavenderStem, styles.lavenderTwo]}>⌁</Text><Text style={[styles.lavenderStem, styles.lavenderThree]}>⌁</Text><View style={[styles.wallGlow, dark && styles.wallGlowDark]} /></>;
}

function GoalKeepsakes({ percent, scale }: { percent: number; scale: number }) {
  return (
    <>
      {percent >= 25 ? <View style={[styles.goalBox, { transform: [{ scale }, { rotate: "3deg" }] }]}><View style={styles.boxTape} /><Text style={styles.goalBoxText}>{percent >= 100 ? "WE DID IT" : "A SMALL DREAM"}</Text></View> : null}
      {percent >= 50 ? <View style={[styles.savingsJar, { transform: [{ scale }] }]}><View style={styles.jarLid} /><Text style={styles.jarMark}>¢</Text><View style={styles.jarCoins}><Text style={styles.jarCoinsText}>● ●</Text></View></View> : null}
      {percent >= 100 ? <View style={styles.confetti}><Text style={styles.confettiText}>✦  ·  ✧  ·  ✦</Text></View> : null}
    </>
  );
}

function SavingMoment({ paused, scale }: { paused: boolean; scale: number }) {
  const drop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (paused) {
      drop.stopAnimation();
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(drop, { duration: 900, toValue: 1, useNativeDriver: true }),
      Animated.delay(350),
      Animated.timing(drop, { duration: 1, toValue: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [drop, paused]);
  return (
    <>
      <View style={[styles.eventJar, { transform: [{ scale }] }]}><View style={styles.eventJarSlot} /><Text style={styles.eventJarMark}>¢</Text></View>
      <Animated.Text style={[styles.flyingCoin, { opacity: drop.interpolate({ inputRange: [0, 0.12, 0.88, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: drop.interpolate({ inputRange: [0, 1], outputRange: [0, 95 * scale] }) }, { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [0, 50 * scale] }) }] }]}>●</Animated.Text>
    </>
  );
}

const CONFETTI_PIECES = [
  { color: "#F4B83F", left: "7%", rotate: "270deg", top: -6 },
  { color: "#7659E8", left: "15%", rotate: "430deg", top: -44 },
  { color: "#F0778B", left: "24%", rotate: "300deg", top: -18 },
  { color: "#53B49F", left: "34%", rotate: "520deg", top: -57 },
  { color: "#FFD26F", left: "43%", rotate: "390deg", top: -29 },
  { color: "#7C68E8", left: "52%", rotate: "610deg", top: -70 },
  { color: "#E96D88", left: "61%", rotate: "340deg", top: -12 },
  { color: "#4DB8CF", left: "70%", rotate: "480deg", top: -51 },
  { color: "#F2B547", left: "79%", rotate: "570deg", top: -25 },
  { color: "#8B72EA", left: "88%", rotate: "450deg", top: -63 },
] as const;

function PartyMoment({ height, paused }: { height: number; paused: boolean }) {
  const fall = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (paused) {
      fall.stopAnimation();
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(fall, { duration: 2100, toValue: 1, useNativeDriver: true }),
      Animated.timing(fall, { duration: 1, toValue: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [fall, paused]);
  return (
    <View pointerEvents="none" style={styles.partyLayer}>
      {CONFETTI_PIECES.map((piece, index) => (
        <Animated.View
          key={`${piece.left}-${index}`}
          style={[styles.partyPiece, { backgroundColor: piece.color, borderRadius: index % 3 === 0 ? 5 : 1, left: piece.left, top: piece.top, transform: [{ translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-18, height + 72] }) }, { translateX: fall.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 === 0 ? 22 : -19, index % 2 === 0 ? -12 : 15] }) }, { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", piece.rotate] }) }] }]}
        />
      ))}
    </View>
  );
}

export function RoomScene({ restStage = null, restFeedbackKey = 0, allowNightSleep = true, petType, equipment, previewItemId, goalPercent = 0, petState = "calm", onPetPress, height = 390, showConfetti = false, interactionDisabled = false, paused = false, animationKey, animateArrival = true, speech, vetVisit, vetLeaving, onPlayMessage, onFeedComplete, onFeedError, onCleanMessage, onCleanComplete, onCleanError, onRestStageFinished, onRestError }: Props) {
  const restShade=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    const a=Animated.timing(restShade,{toValue:restStage && restStage!=="Rest_Exit" ? .16 : 0,duration:restStage==="Rest_Exit"?800:650,useNativeDriver:true});a.start();return()=>a.stop();
  },[restShade,restStage,petType]);
  const arrival = useRef(new Animated.Value(1)).current;
  const playDuration = petType === "cat" ? PLAY_VISUAL_MS : ANIMAL_PLAY_VISUAL_MS;
  const playInput = petType === "cat" ? PLAY_INPUT : ANIMAL_PLAY_INPUT;
  const playSpeech = petType === "cat" ? PLAY_SPEECH_OPACITY : ANIMAL_PLAY_INPUT.map(p => playSpeechOpacity(p * ANIMAL_PLAY_VISUAL_MS));
  const playProgress = useRef(new Animated.Value(0)).current;
  const cleanProgress = useRef(new Animated.Value(0)).current;
  const cleanCamera = useMemo(() => ({
    scale: cleanProgress.interpolate({inputRange:CLEAN_INPUT,outputRange:CLEAN_SCENE_PATH.map(p=>p.cameraScale)}),
    ambience: cleanProgress.interpolate({inputRange:CLEAN_INPUT,outputRange:CLEAN_SCENE_PATH.map(p=>p.ambienceOpacity)}),
    speech: cleanProgress.interpolate({inputRange:CLEAN_INPUT,outputRange:CLEAN_SPEECH_OPACITY}),
  }),[cleanProgress]);
  const feedProgress = useRef(new Animated.Value(0)).current;
  const [feedVisuals] = useState(createFeedVisuals);
  const preview = previewItemId ? getCollectible(previewItemId) : undefined;
  const active = { ...equipment };
  if (preview) active[preview.slot] = preview.id;
  const wallId = active.wall ?? "lavender_wall";
  const wall = WALLS[wallId] ?? WALLS.lavender_wall;
  const midnight = wallId === "midnight_wall";
  const hour = new Date().getHours();
  const isNight = hour < 7 || hour >= 20;
  const petShift = ((new Date().getDate() + Math.floor(hour / 6)) % 3 - 1) * 24;
  const hasRug = active.floor === "star_rug" || active.floor === "cloud_rug";
  const scale = height / 390;
  const decorSize = active.decor === "thirty_day_arch" ? 152 : active.decor === "seven_day_banner" ? 130 : 104;
  const timeState: PetVisualState = petState === "calm" && isNight && allowNightSleep ? "sleeping" : petState === "calm" && hour >= 7 && hour < 11 ? "curious" : petState;

  useEffect(() => {
    if (paused || !animateArrival) {
      arrival.stopAnimation();
      arrival.setValue(1);
      return;
    }
    if (petState !== "peek" && petState !== "waking") {
      arrival.setValue(1);
      return;
    }
    arrival.setValue(0);
    const entrance = Animated.spring(arrival, { damping: petState === "peek" ? 9 : 14, mass: 0.8, stiffness: 95, toValue: 1, useNativeDriver: true });
    entrance.start();
    return () => entrance.stop();
  }, [animateArrival, animationKey, arrival, paused, petState]);

  return (
    <View style={[styles.room, { backgroundColor: wall, height }]}> 
      <WallpaperDetails dark={midnight} id={wallId} />
      <View style={styles.lightWash} />
      <View style={styles.shelf}>
        <View style={[styles.book, { backgroundColor: "#D88770", height: 24 }]} />
        <View style={[styles.book, { backgroundColor: "#7D70AD", height: 31 }]} />
        <View style={[styles.book, { backgroundColor: "#E7B65D", height: 27 }]} />
        <View style={styles.tinyFrame}><Text style={styles.tinyPaw}>♡</Text></View>
      </View>
      <View style={styles.pictureHook} /><View style={styles.pictureStringLeft} /><View style={styles.pictureStringRight} />

      <ItemArt itemId={active.window ?? "round_window"} size={112 * scale} style={[styles.windowArt, { right: 18 * scale, top: 24 * scale }]} />

      <View style={styles.baseboard}><View style={styles.baseboardHighlight} /></View>
      <View style={styles.floor}>
        {[10, 34, 58, 82].map((top) => <View key={top} style={[styles.plankLine, { top: `${top}%` }]} />)}
        <View style={[styles.floorJoint, { left: "18%", top: "10%" }]} /><View style={[styles.floorJoint, { left: "64%", top: "34%" }]} /><View style={[styles.floorJoint, { left: "35%", top: "58%" }]} /><View style={[styles.floorJoint, { left: "78%", top: "82%" }]} />
        <View style={styles.floorLight} />
      </View>

      {hasRug ? <ItemArt itemId={active.floor!} size={188 * scale} style={[styles.rugArt, { bottom: -33 * scale, left: "24%" }]} /> : null}
      <ItemArt itemId={active.furniture ?? "cozy_cushion"} size={132 * scale} style={[styles.furnitureArt, { bottom: 22 * scale, left: 8 * scale }]} />
      {active.decor ? <ItemArt itemId={active.decor} size={decorSize * scale} style={[styles.decorArt, { bottom: 23 * scale, right: 4 * scale }]} /> : null}

      <GoalKeepsakes percent={goalPercent} scale={scale} />
      {petState === "saving" ? <SavingMoment paused={paused} scale={scale} /> : null}
      {(showConfetti || (goalPercent >= 100 && petState === "celebrate")) ? <PartyMoment height={height} paused={paused} /> : null}
      <Animated.View pointerEvents="none" testID="clean-ambience" style={{position:"absolute",left:0,right:0,top:0,bottom:0,backgroundColor:"#93D8E5",opacity:petState==="bathing"?cleanCamera.ambience:0}} />
      <Animated.View pointerEvents="none" testID="rest-ambience" style={{position:"absolute",left:0,right:0,top:0,bottom:0,backgroundColor:"#29223D",opacity:restShade}}/>
      <View style={[styles.petShadow, { bottom: 20 * scale, transform: [{ translateX: petShift }, { scale }] }]} />
      {petState === "vet" && vetVisit ? <ClinicBackdrop height={height} paused={paused} leaving={vetLeaving} /> : null}
      <Animated.View style={[styles.petPosition, { bottom: 19 * scale, transform: [{ translateX: petShift }, { translateY: arrival.interpolate({ inputRange: [0, 1], outputRange: [petState === "peek" ? 105 : 28, 0] }) }, { scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }) }, {scale:petState==="bathing"?cleanCamera.scale:1}] }]}> 
        <PetAvatar onRestStageFinished={onRestStageFinished} onRestError={onRestError} restStage={restStage} restFeedbackKey={restFeedbackKey} cleanProgress={cleanProgress} onCleanMessage={onCleanMessage} onCleanComplete={onCleanComplete} onCleanError={onCleanError} feedProgress={feedProgress} feedVisuals={feedVisuals} onFeedComplete={onFeedComplete} onFeedError={onFeedError} playProgress={playProgress} onPlayMessage={onPlayMessage} animationKey={animationKey} interactionDisabled={interactionDisabled} onPress={onPetPress} outfit={active.outfit} paused={paused} size={height * 0.49} state={timeState} type={petType} vetVisit={vetVisit} />
      </Animated.View>
      <View pointerEvents="none" style={styles.foregroundShine} />
      {speech ? <Animated.View key={petState === "eating" ? "feed-speech" : petState === "playing" ? "play-speech" : petState === "bathing" ? "clean-speech" : "normal-speech"} accessibilityLabel={`${speech.name} says: ${speech.message}`} pointerEvents="none" style={[styles.speechBubble, { bottom: height * 0.49 + 19 * scale + 22,
        opacity: restStage ? 0 : petState === "bathing" ? cleanCamera.speech : petState === "eating" ? feedVisuals.speechOpacity : petState === "playing" ? playProgress.interpolate({ inputRange: playInput, outputRange: playSpeech }) : 1,
        transformOrigin: "50% 100%",
        transform: [{ scale: petState === "eating" ? feedVisuals.speechScale : petState === "playing" ? playProgress.interpolate({
          inputRange: [0, PLAY_SPEECH_DELAY_MS / playDuration, 360 / playDuration, 450 / playDuration, 1],
          outputRange: [0.88, 0.88, 1.035, 1, 1],
        }) : 1 }],
      }]}>
        <View style={[styles.speechTail, { transform: [{ translateX: petShift }] }]} />
        <AppText style={styles.speechName}>{speech.name}</AppText>
        <AppText style={styles.speechText}>{speech.message}</AppText>
      </Animated.View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  room: { borderColor: "rgba(70,54,95,.16)", borderRadius: 28, borderWidth: 1, overflow: "hidden", position: "relative", shadowColor: "#59456D", shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.12, shadowRadius: 14 },
  lightWash: { backgroundColor: "rgba(255,250,236,.18)", borderRadius: 160, height: "66%", position: "absolute", right: "-22%", top: "4%", transform: [{ rotate: "-14deg" }], width: "74%" },
  wallGlow: { backgroundColor: "rgba(255,255,255,.16)", borderRadius: 100, height: 180, left: "22%", position: "absolute", top: -70, width: 180 },
  wallGlowDark: { backgroundColor: "rgba(142,133,211,.1)" },
  wallCloud: { backgroundColor: "rgba(255,246,237,.35)", borderRadius: 99, height: 22, position: "absolute", width: 76 },
  cloudOne: { left: 24, top: 56 },
  cloudTwo: { left: 112, top: 18, transform: [{ scale: 0.7 }] },
  sunsetDisc: { backgroundColor: "rgba(244,177,105,.36)", borderRadius: 35, height: 70, left: 74, position: "absolute", top: 34, width: 70 },
  wallSprig: { color: "rgba(72,125,80,.28)", fontSize: 48, fontWeight: "700", position: "absolute", transform: [{ rotate: "-28deg" }] },
  sprigOne: { left: 18, top: 18 },
  sprigTwo: { left: 132, top: 74, transform: [{ rotate: "20deg" }, { scale: 0.78 }] },
  sprigThree: { left: 246, top: 3, transform: [{ rotate: "-8deg" }, { scale: 0.65 }] },
  wallStars: { color: "rgba(255,225,128,.55)", fontSize: 17, fontWeight: "900", letterSpacing: 6, position: "absolute" },
  starsOne: { left: 18, top: 27 },
  starsTwo: { left: 136, top: 94 },
  wallMoon: { backgroundColor: "rgba(255,237,170,.75)", borderRadius: 28, height: 56, left: 96, position: "absolute", top: 52, width: 56 },
  lavenderStem: { color: "rgba(109,82,156,.25)", fontSize: 62, fontWeight: "900", position: "absolute", transform: [{ rotate: "74deg" }] },
  lavenderOne: { left: 9, top: 10 },
  lavenderTwo: { left: 120, top: 76, transform: [{ rotate: "-72deg" }, { scale: 0.7 }] },
  lavenderThree: { left: 238, top: 8, transform: [{ rotate: "65deg" }, { scale: 0.63 }] },
  shelf: { alignItems: "flex-end", borderBottomColor: "#8D684C", borderBottomWidth: 7, flexDirection: "row", gap: 3, height: 43, left: 22, paddingHorizontal: 6, position: "absolute", top: 112, width: 104 },
  book: { borderColor: "rgba(62,43,50,.22)", borderRadius: 2, borderWidth: 1, width: 11 },
  tinyFrame: { alignItems: "center", backgroundColor: "#FFF9ED", borderColor: "#9C7555", borderRadius: 3, borderWidth: 3, height: 34, justifyContent: "center", marginLeft: 4, transform: [{ rotate: "-4deg" }], width: 29 },
  tinyPaw: { color: "#B18DCC", fontSize: 15, fontWeight: "900" },
  pictureHook: { backgroundColor: "#8B725D", borderRadius: 4, height: 5, left: 68, position: "absolute", top: 99, width: 5 },
  pictureStringLeft: { borderTopColor: "rgba(98,73,58,.55)", borderTopWidth: 1, left: 56, position: "absolute", top: 107, transform: [{ rotate: "-38deg" }], width: 17 },
  pictureStringRight: { borderTopColor: "rgba(98,73,58,.55)", borderTopWidth: 1, left: 70, position: "absolute", top: 107, transform: [{ rotate: "38deg" }], width: 17 },
  windowArt: { position: "absolute", zIndex: 2 },
  baseboard: { backgroundColor: "#F9F0E4", borderTopColor: "rgba(88,62,48,.16)", borderTopWidth: 1, bottom: "37%", height: 13, left: 0, position: "absolute", right: 0, zIndex: 1 },
  baseboardHighlight: { backgroundColor: "rgba(255,255,255,.7)", height: 3, left: 0, position: "absolute", right: 0, top: 1 },
  floor: { backgroundColor: "#D1A371", bottom: 0, height: "38%", left: 0, overflow: "hidden", position: "absolute", right: 0 },
  plankLine: { borderTopColor: "rgba(103,62,34,.20)", borderTopWidth: 1, left: 0, position: "absolute", right: 0, transform: [{ rotate: "-0.6deg" }] },
  floorJoint: { backgroundColor: "rgba(103,62,34,.20)", height: "24%", position: "absolute", width: 1 },
  floorLight: { backgroundColor: "rgba(255,235,187,.15)", borderRadius: 80, height: 120, position: "absolute", right: -18, top: -18, transform: [{ rotate: "-22deg" }], width: 180 },
  rugArt: { position: "absolute", zIndex: 2 },
  furnitureArt: { position: "absolute", zIndex: 4 },
  decorArt: { position: "absolute", zIndex: 5 },
  petShadow: { backgroundColor: "rgba(79,51,42,.16)", borderRadius: 99, height: 24, left: "33%", position: "absolute", width: "34%", zIndex: 3 },
  petPosition: { alignItems: "center", left: "24%", position: "absolute", width: "52%", zIndex: 5 },
  goalBox: { alignItems: "center", backgroundColor: "#CDA06C", borderColor: "#805B39", borderRadius: 4, borderWidth: 2, bottom: 24, height: 42, justifyContent: "center", position: "absolute", right: 83, width: 66, zIndex: 3 },
  boxTape: { backgroundColor: "rgba(249,225,170,.7)", height: "100%", position: "absolute", width: 11 },
  goalBoxText: { backgroundColor: "#FFF5D7", color: "#735038", fontSize: 6, fontWeight: "900", paddingHorizontal: 3, paddingVertical: 2 },
  savingsJar: { alignItems: "center", backgroundColor: "rgba(180,229,220,.88)", borderColor: "#4D8D82", borderRadius: 15, borderWidth: 2, bottom: 68, height: 46, justifyContent: "center", position: "absolute", right: 91, width: 39, zIndex: 4 },
  jarLid: { backgroundColor: "#C6A667", borderColor: "#7B673E", borderRadius: 3, borderWidth: 1, height: 7, position: "absolute", top: -5, width: 34 },
  jarMark: { color: colors.green, fontSize: 15, fontWeight: "900" },
  jarCoins: { bottom: 3, position: "absolute" },
  jarCoinsText: { color: "#D4A53D", fontSize: 7 },
  confetti: { left: 14, position: "absolute", right: 14, top: 8, zIndex: 6 },
  confettiText: { color: "#E6A83C", fontSize: 21, fontWeight: "900", textAlign: "center" },
  eventJar: { alignItems: "center", backgroundColor: "rgba(201,239,230,.95)", borderColor: "#4D8D82", borderRadius: 14, borderWidth: 2, bottom: 24, height: 54, justifyContent: "center", position: "absolute", right: 22, width: 48, zIndex: 6 },
  eventJarMark: { color: colors.green, fontSize: 19, fontWeight: "900" },
  eventJarSlot: { backgroundColor: "#6A644F", borderRadius: 3, height: 3, position: "absolute", top: 7, width: 23 },
  flyingCoin: { bottom: 105, color: "#E5A62E", fontSize: 18, fontWeight: "900", left: "49%", position: "absolute", zIndex: 8 },
  partyLayer: { bottom: 0, left: 0, overflow: "hidden", position: "absolute", right: 0, top: 0, zIndex: 7 },
  partyPiece: { height: 15, position: "absolute", width: 8 },
  foregroundShine: { borderColor: "rgba(255,255,255,.34)", borderRadius: 27, borderWidth: 1, bottom: 1, left: 1, position: "absolute", right: 1, top: 1, zIndex: 8 },
  speechBubble: { backgroundColor: "rgba(255,255,255,0.78)", borderColor: "rgba(221,211,232,0.65)", borderRadius: 24, borderWidth: 1, left: "12%", paddingHorizontal: 14, paddingVertical: 10, position: "absolute", right: "12%", shadowColor: "#59456D", shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.08, shadowRadius: 7, zIndex: 20 },
  speechName: { color: "#5A43C8", fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginBottom: 3, textTransform: "uppercase" },
  speechText: { color: "#29233A", fontSize: 11, fontWeight: "700", lineHeight: 16, textAlign: "center" },
  speechTail: { borderLeftColor: "transparent", borderLeftWidth: 10, borderRightColor: "transparent", borderRightWidth: 10, borderTopColor: "rgba(255,255,255,0.78)", borderTopWidth: 12, bottom: -12, height: 0, left: "50%", marginLeft: -10, position: "absolute", width: 0 },
});
