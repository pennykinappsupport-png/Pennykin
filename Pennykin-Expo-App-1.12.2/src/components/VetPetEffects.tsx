import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { VET_CHECK_MS, VET_HAPPY_MS, VET_TREAT_MS, type VetVisit } from "../vetVisit";
import { ClinicToolArt } from "./ClinicToolArt";

export function VetPetEffects({ size, visit, paused }: { size: number; visit: VetVisit; paused: boolean }) {
  const motion = useRef(new Animated.Value(0)).current;
  const timing = useRef({ key: "", remaining: 0 });
  useEffect(() => {
    const key = `${visit.id}:${visit.stage}:${visit.applied}`;
    const duration = visit.stage === "checking" ? VET_CHECK_MS : visit.stage === "treating" && visit.applied ? VET_TREAT_MS : visit.stage === "happy" ? VET_HAPPY_MS : 0;
    if (timing.current.key !== key) { timing.current = { key, remaining: duration }; motion.setValue(0); }
    if (paused || !duration) return;
    const started = Date.now();
    const sequence = Animated.timing(motion, { duration: timing.current.remaining, toValue: 1, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    sequence.start();
    return () => { sequence.stop(); motion.stopAnimation(); timing.current.remaining = Math.max(0, timing.current.remaining - (Date.now() - started)); };
  }, [motion, paused, visit.applied, visit.id, visit.stage]);

  return <View pointerEvents="none" style={styles.layer}>
    {(visit.stage === "checking" || visit.stage === "treat") ? <View style={{ position: "absolute", left: size * 0.81, top: size * 0.12 }}><Svg width={size * 0.09} height={size * 0.13} viewBox="0 0 30 42"><Path d="M15 2C12 13 2 23 2 29A13 13 0 0 0 28 29C28 21 20 12 15 2Z" fill="#AAD2DD" stroke="#729FAC" strokeWidth={2} /></Svg></View> : null}
    {visit.stage === "checking" ? <Animated.View style={{ position: "absolute", left: size * 0.64, top: size * 0.45, opacity: motion.interpolate({ inputRange: [0, 0.18, 0.8, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: motion.interpolate({ inputRange: [0, 0.32, 0.72, 1], outputRange: [size * 0.28, 0, 0, size * 0.2] }) }, { translateY: motion.interpolate({ inputRange: [0, 0.32, 0.72, 1], outputRange: [-size * 0.18, 0, 0, -size * 0.10] }) }, { rotate: "180deg" }] }}><ClinicToolArt kind="stethoscope" size={size * 0.30} /></Animated.View> : null}
    {visit.stage === "treat" ? <View style={{ position: "absolute", right: -size * 0.06, top: size * 0.2 }}><ClinicToolArt kind="thermometer" size={size * 0.23} /></View> : null}
    {visit.applied ? <Animated.View style={{ position: "absolute", left: size * 0.52, top: size * 0.74, opacity: visit.stage === "treating" ? motion.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 1] }) : 1, transform: visit.stage === "treating" ? [
      { translateX: motion.interpolate({ inputRange: [0, 0.8, 1], outputRange: [-size * 0.5, 0, 0] }) },
      { translateY: motion.interpolate({ inputRange: [0, 0.8, 1], outputRange: [-size * 0.2, 0, 0] }) },
      { rotate: motion.interpolate({ inputRange: [0, 0.8, 1], outputRange: ["-20deg", "7deg", "0deg"] }) },
    ] : [] }}><ClinicToolArt kind="patch" size={size * 0.25} /></Animated.View> : null}
    {visit.stage === "happy" ? <Animated.View style={{ position: "absolute", right: size * 0.01, top: size * 0.12, opacity: motion.interpolate({ inputRange: [0, 0.18, 0.75, 1], outputRange: [0, 1, 1, 0.6] }), transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [6, -size * 0.12] }) }, { scale: motion.interpolate({ inputRange: [0, 0.25, 0.45, 1], outputRange: [0.65, 1.16, 1, 1] }) }] }}><ClinicToolArt kind="heart" size={size * 0.19} /></Animated.View> : null}
  </View>;
}
const styles = StyleSheet.create({ layer: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 8 } });
