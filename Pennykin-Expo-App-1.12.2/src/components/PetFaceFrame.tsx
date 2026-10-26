import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Ellipse, Image as SvgImage } from "react-native-svg";

import { PET_BLINK_IMAGES, PET_EAT_IMAGES } from "../petImages";
import type { PetType } from "../types";

// All original pet art uses a 600 × 640 canvas. Clip inside the face so tiny
// differences in the alternate art's silhouette cannot make the body flicker.
const FACE_REGIONS = {
  cat: { eyes: [[296, 267, 51, 46], [407, 219, 49, 45]], mouth: [369, 302, 55, 42], mouthShift: [-6, 2] },
  dog: { eyes: [[322, 234, 48, 44], [424, 185, 48, 43]], mouth: [399, 273, 59, 51], mouthShift: [-5, 0] },
  rabbit: { eyes: [[278, 298, 46, 45], [386, 255, 46, 44]], mouth: [350, 322, 48, 42], mouthShift: [12, 3] },
} as const;

export function PetFaceFrame({ type, size, frame, visible }: { type: PetType; size: number; frame: "blink" | "eat"; visible: boolean }) {
  const region = FACE_REGIONS[type];
  const regions = frame === "blink" ? region.eyes : [region.mouth];
  const [x, y] = frame === "eat" ? region.mouthShift : [0, 0];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[styles.layer, { height: size, opacity: visible ? 1 : 0, width: size }]}>
      <Svg height={size} width={size} viewBox="0 0 600 640" preserveAspectRatio="xMidYMid meet">
        <Defs><ClipPath id="face-region">{regions.map(([cx, cy, rx, ry], index) => <Ellipse key={index} cx={cx} cy={cy} rx={rx} ry={ry} />)}</ClipPath></Defs>
        <SvgImage clipPath="url(#face-region)" href={frame === "blink" ? PET_BLINK_IMAGES[type] : PET_EAT_IMAGES[type]} x={x} y={y} width={600} height={640} preserveAspectRatio="xMidYMid meet" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ layer: { left: 0, position: "absolute", top: 0 } });
