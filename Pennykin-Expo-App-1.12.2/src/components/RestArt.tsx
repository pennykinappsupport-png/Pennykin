import React from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, G, Image as SvgImage, Rect } from "react-native-svg";
import { CAT_REST_ATLAS, PET_BLINK_IMAGES, PET_IMAGES, PET_REST_IMAGES } from "../petImages";
import type { PetType } from "../types";
import { sleepArtStyle } from "../sleepArtLayout";

export const CAT_REST_LAYOUT = { width: 1254, height: 1254, cell: 627, scale: 1.04,
  offsets: [[-63.8, -20.2], [-20.12, -19.16], [-45.6, 2.68], [-26.36, -6.68]] } as const;
type Weight = number | Animated.AnimatedInterpolation<number>;
export function RestArt({ size, type, weights, atlasReady, onAtlasLoad, onAtlasError }: {
  size: number; type: PetType; weights: Weight[]; atlasReady: boolean; onAtlasLoad: () => void; onAtlasError: () => void;
}) {
  return <View pointerEvents="none" style={[styles.layer, { height: size, width: size }]}>
    <Animated.Image source={PET_IMAGES[type]} resizeMode="contain" fadeDuration={0} style={[styles.layer, { height: size, width: size, opacity: weights[0] }]} />
    {([0, 1, 2, 3] as const).map((cell) => <Animated.View key={cell} style={[styles.layer, { height: size, width: size, opacity: weights[cell + 1] }]}>
      {type === "cat" && atlasReady ? <Svg width={size} height={size} viewBox="0 0 627 627">
        <Defs><ClipPath id={`rest-cell-${cell}`}><Rect width={627} height={627} /></ClipPath></Defs>
        <G transform={`translate(${CAT_REST_LAYOUT.offsets[cell][0]} ${CAT_REST_LAYOUT.offsets[cell][1]}) scale(${CAT_REST_LAYOUT.scale})`}><SvgImage href={CAT_REST_ATLAS} x={-(cell % 2) * 627} y={-Math.floor(cell / 2) * 627} width={1254} height={1254} clipPath={`url(#rest-cell-${cell})`} /></G>
      </Svg> : <Image source={cell < 2 ? PET_BLINK_IMAGES[type] : PET_IMAGES[type]} resizeMode="contain" fadeDuration={0} style={{ height: size, width: size }} />}
    </Animated.View>)}
    <Animated.Image source={PET_REST_IMAGES[type]} resizeMode="contain" fadeDuration={0} style={[styles.layer, { height: size, width: size, opacity: weights[5] }, sleepArtStyle(type, size)]} />
    {type === "cat" ? <Image source={CAT_REST_ATLAS} onLoad={onAtlasLoad} onError={onAtlasError} fadeDuration={0} style={{ position: "absolute", opacity: 0, height: 1, width: 1 }} /> : null}
  </View>;
}
const styles = StyleSheet.create({ layer: { position: "absolute", left: 0, top: 0 } });
