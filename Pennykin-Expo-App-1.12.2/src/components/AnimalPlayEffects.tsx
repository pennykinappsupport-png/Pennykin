import React from "react";
import { Animated, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { ANIMAL_PLAY_INPUT, ANIMAL_PLAY_TIMES, ANIMAL_PLAY_TOY_PATH, RABBIT_PLAY_TOY_PATH, ANIMAL_PLAY_JOY_MS, ANIMAL_PLAY_VISUAL_MS, animalPlayToyOpacity, animalPlayToyRotation, animalPlayToyScale } from "../animalPlayChoreography";
import { AnimalPlayPaws } from "./AnimalPlayArt";
import { playRigTransform } from "./usePlayMotion";

export function AnimalPlayEffects({ type, size, progress, visible, artworkReady }: {
  type: "dog" | "rabbit"; size: number; progress: Animated.Value; visible: boolean; artworkReady: boolean;
}) {
  if (!visible) return null;
  const path = type === "dog" ? ANIMAL_PLAY_TOY_PATH : RABBIT_PLAY_TOY_PATH;
  const ballSize = size * .19;
  return <>
    <Animated.View pointerEvents="none" style={[styles.toy, { width: ballSize, height: ballSize,
      left: -ballSize / 2, top: -ballSize / 2,
      opacity: progress.interpolate({ inputRange: ANIMAL_PLAY_INPUT, outputRange: ANIMAL_PLAY_TIMES.map(animalPlayToyOpacity) }),
      transform: [
        { translateX: progress.interpolate({ inputRange: ANIMAL_PLAY_INPUT, outputRange: path.map(p => p.x * size) }) },
        { translateY: progress.interpolate({ inputRange: ANIMAL_PLAY_INPUT, outputRange: path.map(p => p.y * size) }) },
        { rotate: progress.interpolate({ inputRange: ANIMAL_PLAY_INPUT, outputRange: ANIMAL_PLAY_TIMES.map(t => `${animalPlayToyRotation(t)}deg`) }) },
        { scale: progress.interpolate({ inputRange: ANIMAL_PLAY_INPUT, outputRange: ANIMAL_PLAY_TIMES.map(animalPlayToyScale) }) },
      ],
    }]}><Svg width={ballSize} height={ballSize} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={45} fill="#F4B75C" stroke="#B97442" strokeWidth={4} />
      <Path d="M50 16 L60 36 L83 39 L66 56 L70 79 L50 68 L30 79 L34 56 L17 39 L40 36 Z" fill="#FFF4C2" stroke="#D58A48" strokeWidth={2} />
      <Path d="M23 24 Q35 12 49 14" stroke="#FFFBE3" strokeWidth={6} strokeLinecap="round" fill="none" />
    </Svg></Animated.View>
    {artworkReady ? <Animated.View pointerEvents="none" style={[styles.paws, { width: size, height: size,
      transformOrigin: "50% 97%", transform: playRigTransform(progress, size, type),
    }]}><AnimalPlayPaws type={type} size={size} progress={progress} /></Animated.View> : null}
    {[0, 1, 2, 3, 4].map(i => {
      const at = (ANIMAL_PLAY_JOY_MS + i * 90) / ANIMAL_PLAY_VISUAL_MS;
      const input = [0, at, at + .035, at + .085, at + .125, at + .18, 1];
      return <Animated.Text key={i} pointerEvents="none" style={[styles.star, {
        left: size * (.15 + i * .18), top: size * (i % 2 ? .04 : .13), fontSize: size * (i % 2 ? .075 : .10),
        opacity: progress.interpolate({ inputRange: input, outputRange: [0, 0, 1, .3, 1, 0, 0] }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, at, at + .18, 1], outputRange: [0, 0, -size * .10, -size * .10] }) },
          { scale: progress.interpolate({ inputRange: input, outputRange: [.3, .3, 1.2, .65, 1, .4, .4] }) },
        ],
      }]}>✦</Animated.Text>;
    })}
  </>;
}
const styles = StyleSheet.create({
  toy: { position: "absolute", zIndex: 6 },
  paws: { position: "absolute", left: 0, top: 0, zIndex: 7 },
  star: { position: "absolute", color: "#F5C76D", fontWeight: "900", zIndex: 8 },
});
