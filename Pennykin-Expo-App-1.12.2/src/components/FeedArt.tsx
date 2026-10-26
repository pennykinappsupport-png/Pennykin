import React from "react";
import { Animated, StyleSheet } from "react-native";
import Svg, { ClipPath, Defs, Image as SvgImage, Rect } from "react-native-svg";
import { CAT_CARE_ATLAS, CAT_LICK_IMAGE, PET_CARE_POSES, PET_IMAGES } from "../petImages";
import type { FeedVisualValues } from "../feedTimeline";
import type { PetType } from "../types";

// Outgoing and incoming views stay mounted throughout every crossfade.
// Neither layer visibility nor the container uses a boolean opacity switch.
export function FeedArt({ type, size, visuals, onLayerLoad, onLayerError }: { type: PetType; size: number; visuals: FeedVisualValues<Animated.Value>; onLayerLoad: (index: number) => void; onLayerError?: (index: number) => void }) {
  return <Animated.View collapsable={false} pointerEvents="none" style={[styles.layer, { height: size, width: size, opacity: visuals.visibility }]}>
    <Animated.View collapsable={false} testID="feed-image-0" style={[styles.layer, { height: size, width: size, opacity: visuals.layers[0] }]}>
      <Animated.Image source={PET_IMAGES[type]} onLoad={() => onLayerLoad(0)} onError={() => onLayerError?.(0)} fadeDuration={0} resizeMode="contain" style={[styles.layer, { height: size, width: size }]} />
    </Animated.View>
    {([0, 1, 2, 4] as const).map((pose, index) => <Animated.View collapsable={false} key={pose} testID={`feed-image-${index + 1}`} style={[styles.layer, { height: size, width: size, opacity: visuals.layers[index + 1] }]}>
      {type === "cat" && pose !== 4 ?
      <Svg width={size} height={size} viewBox="0 0 627 627">
        <Defs><ClipPath id={`feed-cell-${pose}`}><Rect width={627} height={627} /></ClipPath></Defs>
        <SvgImage href={CAT_CARE_ATLAS} onLoad={() => onLayerLoad(index + 1)} x={-(pose % 2) * 627} y={-Math.floor(pose / 2) * 627} width={1254} height={1254} clipPath={`url(#feed-cell-${pose})`} />
      </Svg>
      : <Animated.Image source={type === "cat" ? CAT_LICK_IMAGE : PET_CARE_POSES[type][pose]} onLoad={() => onLayerLoad(index + 1)} onError={() => onLayerError?.(index + 1)} fadeDuration={0} resizeMode="contain" style={[styles.layer, { height: size, width: size }]} />}
    </Animated.View>)}
  </Animated.View>;
}

const styles = StyleSheet.create({ layer: { position: "absolute", left: 0, top: 0 } });
