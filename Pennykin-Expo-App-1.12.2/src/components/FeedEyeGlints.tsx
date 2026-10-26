import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { PetType } from "../types";

const EYES: Record<PetType, readonly (readonly [number, number])[]> = {
  cat: [[294, 252], [405, 204]],
  dog: [[322, 234], [424, 185]],
  rabbit: [[278, 298], [386, 255]],
};

// Eye-only anticipation overlay: never swap or fade the complete kitten.
export function FeedEyeGlints({ type = "cat", size, visible, glow }: { type?: PetType; size: number; visible: boolean; glow: Animated.Value | Animated.AnimatedInterpolation<number> }) {
  return <View pointerEvents="none" style={[styles.layer, { height: size, width: size, opacity: visible ? 1 : 0 }]}>
    <Animated.View style={{ opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
      <Svg width={size} height={size} viewBox="0 0 600 640">
        {EYES[type].map(([x, y]) => <React.Fragment key={x}>
          <Circle cx={x} cy={y} r={19} fill="#FFE8A1" opacity={0.25} />
          <Path d={`M${x} ${y - 12} L${x + 3} ${y - 3} L${x + 11} ${y} L${x + 3} ${y + 3} L${x} ${y + 12} L${x - 3} ${y + 3} L${x - 11} ${y} L${x - 3} ${y - 3}Z`} fill="#FFF9DB" />
        </React.Fragment>)}
      </Svg>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({ layer: { left: 0, position: "absolute", top: 0 } });
