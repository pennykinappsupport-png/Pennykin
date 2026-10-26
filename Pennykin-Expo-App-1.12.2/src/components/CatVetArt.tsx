import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Image as SvgImage, Rect } from "react-native-svg";
import { CAT_VET_ATLAS } from "../petImages";

const CELL = 887;
export function CatVetArt({ size, visible, happy }: { size: number; visible: boolean; happy: boolean }) {
  return <View pointerEvents="none" style={[styles.layer, { width: size, height: size }]}>
    {([0, 1] as const).map((cell) => <View key={cell} style={[styles.layer, { width: size, height: size, opacity: visible && cell === (happy ? 1 : 0) ? 1 : 0 }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${CELL} ${CELL}`}>
        <Defs><ClipPath id={`vet-pose-${cell}`}><Rect width={CELL} height={CELL} /></ClipPath></Defs>
        {/* Match the foot baseline and center while retaining original RGBA bytes. */}
        <SvgImage href={CAT_VET_ATLAS} x={-cell * CELL - (cell === 0 ? 44 : 0)} y={28} width={CELL * 2} height={CELL} clipPath={`url(#vet-pose-${cell})`} />
      </Svg>
    </View>)}
  </View>;
}
const styles = StyleSheet.create({ layer: { left: 0, top: 0, position: "absolute" } });
