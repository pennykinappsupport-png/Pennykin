import React, { useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Ellipse, Image as SvgImage } from "react-native-svg";
import { ANIMAL_PLAY_POSES, PET_IMAGES } from "../petImages";
import { ANIMAL_PLAY_INPUT, ANIMAL_PLAY_WEIGHT_PATH } from "../animalPlayChoreography";

// Resident decoded layers crossfade on the SAME clock as the body and toy.
// Layer zero duplicates idle art only inside this scene; the exterior base
// is hidden for the entire scene, so there is never an extra stationary pet.
export function AnimalPlayArt({ type, size, progress, visible, onReady, onError }: {
  type: "dog" | "rabbit"; size: number; progress: Animated.Value;
  visible: boolean; onReady: () => void; onError: () => void;
}) {
  const decoded = useRef(new Set<number>());
  return <View pointerEvents="none" style={[styles.layer, { width: size, height: size, opacity: visible ? 1 : 0 }]}>
    {[PET_IMAGES[type], ...ANIMAL_PLAY_POSES[type]].map((source, i) => <Animated.Image
      key={i} source={source} fadeDuration={0} resizeMode="contain"
      onLoad={() => { decoded.current.add(i); if (decoded.current.size === 7) onReady(); }}
      onError={() => { decoded.current.delete(i); onError(); }}
      style={[styles.layer, { width: size, height: size,
        opacity: progress.interpolate({ inputRange: ANIMAL_PLAY_INPUT, outputRange: ANIMAL_PLAY_WEIGHT_PATH.map(w => w[i]!) }),
      }]} />)}
  </View>;
}

// Clip only the hugging paws above the runtime ball. Never paint a whole
// second body, and fade this cutout with its source pose's exact weight.
export function AnimalPlayPaws({ type, size, progress }: { type: "dog" | "rabbit"; size: number; progress: Animated.Value }) {
  const hands = type === "dog" ? [[329, 386, 50, 39], [475, 357, 43, 37]] : [[279, 417, 48, 39], [439, 398, 39, 38]];
  const id = `animal-play-paws-${type}`;
  return <Animated.View pointerEvents="none" style={{ width: size, height: size,
    opacity: progress.interpolate({ inputRange: ANIMAL_PLAY_INPUT, outputRange: ANIMAL_PLAY_WEIGHT_PATH.map(w => w[5]!) }),
  }}><Svg width={size} height={size} viewBox="-20 0 640 640">
    <Defs><ClipPath id={id}>{hands.map(([cx, cy, rx, ry], i) => <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />)}</ClipPath></Defs>
    <SvgImage href={ANIMAL_PLAY_POSES[type][4]} x={0} y={0} width={600} height={640} clipPath={`url(#${id})`} />
  </Svg></Animated.View>;
}
const styles = StyleSheet.create({ layer: { position: "absolute", left: 0, top: 0 } });
