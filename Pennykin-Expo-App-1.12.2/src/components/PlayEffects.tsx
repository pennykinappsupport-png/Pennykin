import React from "react";
import { Animated, StyleSheet } from "react-native";
import { PLAY_INPUT, PLAY_TIMES, PLAY_TOY_PATH, PLAY_TOY_OPACITY, PLAY_VISUAL_MS, playToyRotation, playToyScale, type PlayPose } from "../playChoreography";
import { ItemArt } from "./ItemArt";
import { CatPlayArt } from "./CatPlayArt";
import { playRigTransform } from "./usePlayMotion";

export function PlayEffects({ size, progress, visible, pose }: { size: number; progress: Animated.Value; visible: boolean; pose: PlayPose }) {
  // Removing this subtree on completion/cancel complements native opacity=0.
  // It cannot leave a temporary prop among the room's permanent decorations.
  if (!visible) return null;
  return <>
    <Animated.View pointerEvents="none" style={[styles.toy, {
      // Native-driven end visibility is independent of React catch callbacks,
      // image readiness and the owner still being in its finishing phase.
      opacity: progress.interpolate({ inputRange: PLAY_INPUT, outputRange: PLAY_TOY_OPACITY }),
      transform: [
        { translateX: progress.interpolate({ inputRange: PLAY_INPUT, outputRange: PLAY_TOY_PATH.map((p) => p.x * size) }) },
        { translateY: progress.interpolate({ inputRange: PLAY_INPUT, outputRange: PLAY_TOY_PATH.map((p) => p.y * size) }) },
        { scale: progress.interpolate({ inputRange: PLAY_INPUT, outputRange: PLAY_TIMES.map(playToyScale) }) },
        { rotate: progress.interpolate({ inputRange: PLAY_INPUT, outputRange: PLAY_TIMES.map((t) => `${playToyRotation(t)}deg`) }) },
      ],
    }]}><ItemArt itemId="star_plush" size={size * 0.27} /></Animated.View>
    {/* Only the touching paws are composited above the single toy. The entire
        second body is never visible; this keeps the star between the paws. */}
    {pose !== null ? <Animated.View pointerEvents="none" style={[styles.paws, {
      height: size, width: size, transformOrigin: "50% 97%", transform: playRigTransform(progress, size),
    }]}><CatPlayArt size={size} pose={pose} pawsOnly /></Animated.View> : null}
    {[0, 1, 2, 3].map((i) => {
      const start = (920 + i * 55) / PLAY_VISUAL_MS;
      return <Animated.Text key={i} pointerEvents="none" style={[styles.star, {
        fontSize: size * (i % 2 ? 0.07 : 0.10), left: size * (0.28 + i * 0.17), top: size * (i % 2 ? 0.08 : 0.16),
        opacity: progress.interpolate({ inputRange: [0, start, start + 0.035, start + 0.09, start + 0.16, 1], outputRange: [0, 0, 1, 0.35, 0, 0] }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, start, start + 0.16, 1], outputRange: [0, 0, -size * 0.07, -size * 0.07] }) },
          { scale: progress.interpolate({ inputRange: [0, start, start + 0.035, start + 0.09, start + 0.16, 1], outputRange: [0.3, 0.3, 1.15, 0.8, 0.5, 0.5] }) },
        ],
      }]}>✦</Animated.Text>;
    })}
  </>;
}
const styles = StyleSheet.create({
  toy: { position: "absolute", left: 0, top: 0, zIndex: 6 },
  paws: { position: "absolute", left: 0, top: 0, zIndex: 7 },
  star: { position: "absolute", color: "#F5C76D", fontWeight: "900", zIndex: 8 },
});
