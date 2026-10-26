import React, { useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

import { PET_CARE_POSES } from "../petImages";
import type { CatCarePose } from "../careChoreography";

export function PetCareArt({ type, size, frame, progress, grooming, onReady, onError }: {
  type: "dog" | "rabbit";
  size: number;
  frame: CatCarePose;
  progress: Animated.Value;
  grooming: Animated.Value;
  onReady: () => void;
  onError: () => void;
}) {
  const decoded = useRef(new Set<number>());
  return <View pointerEvents="none" style={[styles.layer, { height: size, width: size }]}>
    {PET_CARE_POSES[type].map((source, cell) => {
      const motion = cell === 3 ? [
        { translateY: progress.interpolate({ inputRange: [0, 0.42, 0.52, 0.64, 0.76, 0.84, 1], outputRange: [0, 0, -size * 0.006, size * 0.006, -size * 0.006, 0, 0] }) },
        { rotate: progress.interpolate({ inputRange: [0, 0.42, 0.52, 0.64, 0.76, 0.84, 1], outputRange: ["0deg", "0deg", "1.8deg", "-1.8deg", "1.8deg", "0deg", "0deg"] }) },
      ] : cell === 2 || cell === 4 ? [
        { rotate: grooming.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-1.2deg", "0deg", "1.2deg"] }) },
        { translateY: grooming.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, size * 0.006] }) },
      ] : [];
      return <Animated.View key={cell} style={[styles.layer, {
        height: size, width: size, opacity: cell === frame ? 1 : 0,
        transformOrigin: "50% 94%", transform: motion,
      }]}>
        {/* Every pose stays mounted and decoded throughout the action. */}
        <Image source={source} fadeDuration={0} resizeMode="contain" style={{ height: size, width: size }}
          onLoad={() => { decoded.current.add(cell); if (decoded.current.size === PET_CARE_POSES[type].length) onReady(); }}
          onError={() => { decoded.current.delete(cell); onError(); }} />
      </Animated.View>;
    })}
  </View>;
}

const styles = StyleSheet.create({ layer: { left: 0, position: "absolute", top: 0 } });
