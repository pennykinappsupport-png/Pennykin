import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Ellipse, Image as SvgImage, Rect } from "react-native-svg";
import { CAT_PLAY_CLEAN_ATLAS } from "../petImages";
import type { PlayPose } from "../playChoreography";

// Six empty-handed poses: the toy is never baked into a visible pet image.
// Keep every decoded view resident. SVG coordinates align the paw baseline and
// crop the transparent gutters without editing the generated RGBA bitmap.
export const CAT_PLAY_LAYOUT = { width: 1536, height: 1024, cell: 512, rowSplit: 496,
  viewBox: "14 0 490 496", offsets: [18, 38, 4, 4, 4, 0] } as const;
const PAWS = {
  2: [[282, 352, 42, 38], [406, 350, 38, 38]],
  3: [[286, 350, 42, 38], [408, 343, 38, 38]],
  4: [[314, 392, 42, 34], [424, 386, 34, 34]],
} as const;
export function CatPlayArt({ size, pose, pawsOnly = false }: { size: number; pose: PlayPose; pawsOnly?: boolean }) {
  return <View pointerEvents="none" style={[styles.layer, { height: size, width: size }]}>
    {([0, 1, 2, 3, 4, 5] as const).map((cell) => {
      const hands = cell === 2 || cell === 3 || cell === 4 ? PAWS[cell] : null;
      if (pawsOnly && !hands) return null;
      const clipId = `clean-play-${pawsOnly ? "hands" : "body"}-${cell}`;
      return <View key={cell} style={[styles.layer, { height: size, width: size, opacity: pose === cell ? 1 : 0 }]}>
        <Svg width={size} height={size} viewBox={CAT_PLAY_LAYOUT.viewBox}>
          <Defs><ClipPath id={clipId}>{pawsOnly && hands
            ? hands.map(([cx, cy, rx, ry], i) => <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />)
            : <Rect x={14} y={0} width={490} height={496} />}</ClipPath></Defs>
          <SvgImage href={CAT_PLAY_CLEAN_ATLAS} x={-(cell % 3) * 512}
            y={-(cell < 3 ? 0 : CAT_PLAY_LAYOUT.rowSplit) + CAT_PLAY_LAYOUT.offsets[cell]}
            width={1536} height={1024} clipPath={`url(#${clipId})`} />
        </Svg>
      </View>;
    })}
  </View>;
}
const styles = StyleSheet.create({ layer: { left: 0, top: 0, position: "absolute" } });
