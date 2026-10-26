import { useEffect, useLayoutEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { REST_ENTER_MS, REST_EXIT_MS, REST_ZZZ_FADE_MS, type RestStage } from "../restChoreography";

export function useRestMotion(stage: RestStage | null, id: string | undefined, paused: boolean, feedbackKey: number) {
  const progress = useRef(new Animated.Value(0)).current;
  const zzzOpacity = useRef(new Animated.Value(0)).current;
  const zzzFloat = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const position = useRef(0);
  const scope = `${id ?? "idle"}:${stage ?? "idle"}`;
  const currentScope = useRef(scope);
  const lastNudge = useRef("");
  useLayoutEffect(() => {
    currentScope.current = scope;
    progress.stopAnimation(); position.current = 0; progress.setValue(0);
    nudge.stopAnimation(); nudge.setValue(0);
    // The entering state's last frame is already asleep. Exiting starts with
    // the same sleep frame; the state boundary itself never swaps the body.
    if (!stage || stage === "Rest_Enter") zzzOpacity.setValue(0);
  }, [scope, nudge, progress, stage, zzzOpacity]);
  useEffect(() => {
    const listener = progress.addListener(({ value }) => { position.current = value; });
    return () => progress.removeListener(listener);
  }, [progress]);
  useEffect(() => {
    if (!stage || stage === "Rest_Loop" || paused) return;
    const duration = stage === "Rest_Enter" ? REST_ENTER_MS : REST_EXIT_MS;
    const animation = Animated.timing(progress, { toValue: 1, duration: duration * (1 - position.current), easing: Easing.linear, useNativeDriver: true });
    animation.start();
    return () => {
      animation.stop();
      progress.stopAnimation((value) => { if (currentScope.current === scope) position.current = value; });
    };
  }, [paused, progress, scope, stage]);
  useEffect(() => {
    zzzOpacity.stopAnimation();
    if (!stage) { zzzOpacity.setValue(0); return; }
    if (paused || stage === "Rest_Enter") return;
    const animation = Animated.timing(zzzOpacity, { toValue: stage === "Rest_Loop" ? 1 : 0, duration: REST_ZZZ_FADE_MS, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [paused, stage, zzzOpacity]);
  useEffect(() => {
    if (paused || stage !== "Rest_Loop") return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(zzzFloat, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(zzzFloat, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [paused, stage, zzzFloat]);
  useEffect(() => {
    if (!feedbackKey || stage !== "Rest_Loop" || paused) return;
    const key = `${id}:${feedbackKey}`;
    if (lastNudge.current === key) return;
    lastNudge.current = key;
    nudge.stopAnimation(); nudge.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(nudge, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(nudge, { toValue: -0.6, duration: 65, useNativeDriver: true }),
      Animated.spring(nudge, { toValue: 0, damping: 9, stiffness: 220, mass: 0.35, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [feedbackKey, id, nudge, paused, stage]);

  const blend = (inputRange: number[], outputRange: number[]) => progress.interpolate({ inputRange, outputRange, extrapolate: "clamp" });
  const weights: Array<number | Animated.AnimatedInterpolation<number>> = stage === "Rest_Enter" ? [
    blend([0, 0.12, 1], [1, 0, 0]), // base
    blend([0, 0.12, 0.30, 0.40, 1], [0, 1, 1, 0, 0]), // rub eyes
    blend([0, 0.30, 0.40, 0.60, 0.72, 1], [0, 0, 1, 1, 0, 0]), // yawn
    0, // stretch
    blend([0, 0.60, 0.72, 0.80, 0.98, 1], [0, 0, 1, 1, 0, 0]), // settle
    blend([0, 0.80, 0.98, 1], [0, 0, 1, 1]), // sleep
  ] : stage === "Rest_Exit" ? [
    blend([0, 0.86, 1], [0, 0, 1]), 0, 0,
    blend([0, 0.28, 0.40, 0.65, 0.82, 1], [0, 0, 1, 1, 0, 0]),
    blend([0, 0.24, 0.28, 0.40, 0.65, 0.82, 0.86, 1], [0, 1, 1, 0, 0, 1, 1, 0]),
    blend([0, 0.24, 1], [1, 0, 0]),
  ] : [0, 0, 0, 0, 0, stage === "Rest_Loop" ? 1 : 0];

  const transform = stage === "Rest_Enter" ? [
    { translateY: blend([0, 0.3, 0.52, 0.74, 0.9, 1], [0, 1, -2, 6, 1, 0]) },
    { scaleY: blend([0, 0.3, 0.52, 0.74, 0.9, 1], [1, 0.985, 1.04, 0.94, 0.99, 1]) },
    { scaleX: blend([0, 0.52, 0.74, 1], [1, 0.985, 1.03, 1]) },
  ] : stage === "Rest_Exit" ? [
    { translateY: blend([0, 0.24, 0.40, 0.60, 0.75, 0.9, 1], [0, -1, -7, -3, 1.5, -0.6, 0]) },
    { scaleY: blend([0, 0.24, 0.40, 0.60, 0.75, 0.9, 1], [1, 1.02, 1.08, 1.03, 0.985, 1.006, 1]) },
    { scaleX: blend([0, 0.40, 0.60, 0.75, 1], [1, 0.97, 1, 1.015, 1]) },
  ] : [];
  return { progress, weights, transform, zzzOpacity, zzzFloat, nudge };
}
