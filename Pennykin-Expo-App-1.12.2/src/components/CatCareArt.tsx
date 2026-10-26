import React from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Image as SvgImage, Rect } from "react-native-svg";

import { CAT_CARE_ATLAS, CAT_LICK_IMAGE } from "../petImages";
import type { CatCarePose } from "../careChoreography";

// Four equal 627px cells: receive, eat, satisfied, wipe. Keep every decoded
// frame mounted; selecting a cell changes static visibility only.
const CELL = 627;

export function CatCareArt({ size, frame, progress, grooming }: { size: number; frame: CatCarePose; progress: Animated.Value; grooming: Animated.Value }) {
  return <View pointerEvents="none" style={[styles.layer, { height: size, width: size }]}>
    {([0, 1, 2, 3] as const).map((cell) => {
      const sourceX = -(cell % 2) * CELL;
      const sourceY = -Math.floor(cell / 2) * CELL;
      // Move the complete pose: cutting an arm out of this illustration tears
      // the collar/shoulder seam. The raised sponge stays against the cheek
      // while a small rocking motion gives the face-wash its rhythm.
      const motion = cell === 3 ? [
        { translateY: progress.interpolate({ inputRange: [0, 0.42, 0.52, 0.64, 0.76, 0.84, 1], outputRange: [0, 0, -size * 0.006, size * 0.006, -size * 0.006, 0, 0] }) },
        { rotate: progress.interpolate({ inputRange: [0, 0.42, 0.52, 0.64, 0.76, 0.84, 1], outputRange: ["0deg", "0deg", "1.8deg", "-1.8deg", "1.8deg", "0deg", "0deg"] }) },
      ] : [];
      return <Animated.View key={cell} style={[styles.layer, {
        height: size, opacity: cell === frame ? 1 : 0, width: size,
        transformOrigin: cell === 3 ? "54% 66%" : "50% 92%", transform: motion,
      }]}>
          <Svg width={size} height={size} viewBox={`0 0 ${CELL} ${CELL}`}>
            <Defs><ClipPath id={`care-cell-${cell}`}><Rect width={CELL} height={CELL} /></ClipPath></Defs>
            <SvgImage href={CAT_CARE_ATLAS} x={sourceX} y={sourceY} width={CELL * 2} height={CELL * 2} clipPath={`url(#care-cell-${cell})`} />
          </Svg>
      </Animated.View>;
    })}
    {/* A distinct groom pose keeps a bath sponge out of the Feed finale. */}
    <Animated.View style={[styles.layer, {
      height: size, width: size, opacity: frame === 4 ? 1 : 0,
      transformOrigin: "50% 94%", transform: [
        { rotate: grooming.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-1.2deg", "0deg", "1.2deg"] }) },
        { translateY: grooming.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, size * 0.006] }) },
      ],
    }]}>
      <Image source={CAT_LICK_IMAGE} fadeDuration={0} resizeMode="contain" style={{ height: size, width: size }} />
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({ layer: { left: 0, position: "absolute", top: 0 } });
