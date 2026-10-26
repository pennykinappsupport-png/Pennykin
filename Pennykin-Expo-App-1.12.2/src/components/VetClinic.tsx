import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { AppText as Text } from "../display";
import { colors } from "../theme";
import type { VetVisit } from "../vetVisit";
import { Button } from "./Button";
import { ClinicSetArt } from "./ClinicToolArt";

export function ClinicBackdrop({ height, paused, leaving = false }: { height: number; paused: boolean; leaving?: boolean }) {
  const arrival = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (paused) { arrival.stopAnimation(); return; }
    const motion = leaving ? Animated.timing(arrival, { toValue: 0, duration: 220, useNativeDriver: true }) : Animated.spring(arrival, { toValue: 1, damping: 17, stiffness: 120, mass: 0.8, useNativeDriver: true });
    motion.start();
    return () => motion.stop();
  }, [arrival, leaving, paused]);
  return <Animated.View pointerEvents="none" style={{ bottom: 0, height: height * 0.49, left: 0, right: 0, position: "absolute", zIndex: 4, opacity: arrival.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }), transform: [{ translateX: arrival.interpolate({ inputRange: [0, 1], outputRange: [38, 0] }) }, { scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }}><ClinicSetArt /></Animated.View>;
}

function VetCheckSound({ visit, paused }: { visit: VetVisit; paused: boolean }) {
  const player = useAudioPlayer(require("../../assets/audio/vet-check.wav"));
  const played = useRef(false);
  useEffect(() => {
    let active = true;
    if (paused) { player.pause(); return; }
    if (visit.stage !== "treat" || played.current) return;
    played.current = true;
    (async () => {
      await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, allowsRecording: false, interruptionMode: "mixWithOthers" });
      player.volume = 0.4;
      await player.seekTo(0);
      if (active) player.play();
    })().catch(() => { /* A muted/unavailable audio session does not block care. */ });
    return () => { active = false; player.pause(); };
  }, [paused, player, visit.stage]);
  return null;
}

export function VetClinicControls({ visit, name, paused, onTreat, onSoothe, onClose }: { visit: VetVisit; name: string; paused: boolean; onTreat: () => void; onSoothe: () => void; onClose: () => void }) {
  const step = visit.stage === "checking" ? 0 : visit.stage === "treat" || visit.stage === "treating" ? 1 : 2;
  const titles = { checking: "Listening to a little heartbeat…", treat: "Ready for a comfort patch", treating: "A gentle patch, then some reassurance", soothe: `Pet ${name} to help them relax`, happy: "Feeling safe and cared for" };
  return <View style={styles.card}>
    <VetCheckSound key={visit.id} visit={visit} paused={paused} />
    <View style={styles.header}><Text style={styles.title}>A gentle vet visit</Text><Pressable accessibilityRole="button" accessibilityLabel="Close vet visit" disabled={visit.stage === "treating" || paused} onPress={onClose} hitSlop={8}><Text style={[styles.close, (visit.stage === "treating" || paused) && { opacity: 0.4 }]}>Close</Text></Pressable></View>
    <View style={styles.steps}>{["Check-up", "Treatment", "Soothe"].map((label, i) => <View key={label} style={[styles.step, i <= step && styles.activeStep]}><Text style={[styles.stepText, i <= step && styles.activeText]}>{i + 1}. {label}</Text></View>)}</View>
    <Text style={styles.copy}>{titles[visit.stage]}</Text>
    {visit.stage === "checking" ? <Text style={styles.detail}>The stethoscope checks automatically in about a second.</Text> : null}
    {visit.stage === "treat" ? <><Button label="Apply comfort patch · 20 🪙" disabled={paused} onPress={onTreat} /><Text style={styles.detail}>20 pet coins, charged once when you apply the patch.</Text></> : null}
    {visit.stage === "treating" ? <Text style={styles.detail}>{visit.applied ? "The patch is on. A little comfort comes next." : "Getting the patch ready…"}</Text> : null}
    {visit.stage === "soothe" ? <><Button label={`Pet ${name}`} disabled={paused} onPress={onSoothe} /><Text style={styles.detail}>You can also tap your pet in the room. No extra coins.</Text></> : null}
    {visit.stage === "happy" ? <Text style={styles.detail}>All done. Back to your little home in a moment.</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 14, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { color: colors.text, fontWeight: "800", fontSize: 17, flex: 1 },
  close: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  steps: { flexDirection: "row", gap: 5 },
  step: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 7, paddingHorizontal: 3, borderRadius: 10, backgroundColor: colors.track },
  activeStep: { backgroundColor: colors.primarySoft },
  stepText: { fontSize: 11, color: colors.muted, fontWeight: "700", textAlign: "center" },
  activeText: { color: colors.primary },
  copy: { color: colors.text, fontSize: 14, fontWeight: "700" },
  detail: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
