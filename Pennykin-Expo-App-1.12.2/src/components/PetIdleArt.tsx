import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from "react-native-svg";

import { PET_IMAGES } from "../petImages";
import type { PetType } from "../types";

const EARS = {
  cat: { path: "M339 148 L391 18 Q430 35 442 77 Q456 123 448 166 L415 176Z", pivot: "66% 27%", angle: 2 },
  dog: { path: "M390 104 Q398 14 466 46 Q526 42 560 99 L558 139 Q525 164 476 167 Q421 146 390 104Z", pivot: "68% 20%", angle: 2.5 },
  rabbit: { path: "M235 210 Q169 231 94 326 Q25 393 24 449 Q19 484 58 497 Q134 474 187 402 Q215 350 231 306 L251 245Z", pivot: "40% 38%", angle: 1.8 },
} as const;

export function PetIdleArt({ type, size, visible, paused }: { type: PetType; size: number; visible: boolean; paused: boolean }) {
  const fidget = useRef(new Animated.Value(0)).current;
  const ear = EARS[type];
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let movement: Animated.CompositeAnimation | null = null;
    const schedule = () => {
      if (!active || !visible || paused) return;
      timer = setTimeout(() => {
        if (!active) return;
        movement = Animated.sequence([
          Animated.timing(fidget, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(fidget, { toValue: -0.45, duration: 170, useNativeDriver: true }),
          Animated.timing(fidget, { toValue: 0.3, duration: 140, useNativeDriver: true }),
          Animated.timing(fidget, { toValue: 0, duration: 190, useNativeDriver: true }),
        ]);
        movement.start(({ finished }) => { if (finished && active) schedule(); });
      }, 4500 + Math.floor(Math.random() * 4000));
    };
    fidget.setValue(0);
    schedule();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      movement?.stop();
      fidget.stopAnimation();
      fidget.setValue(0);
    };
  }, [fidget, paused, visible]);
  return <View pointerEvents="none" style={[styles.layer, { width: size, height: size, opacity: visible ? 1 : 0 }]}>
    <Svg width={size} height={size} viewBox="0 0 600 640">
      <Defs><ClipPath id="body-without-ear"><Path d={`M0 0H600V640H0Z ${ear.path}`} fillRule="evenodd" clipRule="evenodd" /></ClipPath></Defs>
      <SvgImage href={PET_IMAGES[type]} width={600} height={640} clipPath="url(#body-without-ear)" />
    </Svg>
    <Animated.View style={[styles.layer, { width: size, height: size, transformOrigin: ear.pivot, transform: [{ rotate: fidget.interpolate({ inputRange: [-1, 0, 1], outputRange: [`-${ear.angle}deg`, "0deg", `${ear.angle}deg`] }) }] }]}>
      <Svg width={size} height={size} viewBox="0 0 600 640">
        <Defs><ClipPath id="idle-ear"><Path d={ear.path} /></ClipPath></Defs>
        <SvgImage href={PET_IMAGES[type]} width={600} height={640} clipPath="url(#idle-ear)" />
      </Svg>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({ layer: { left: 0, position: "absolute", top: 0 } });
