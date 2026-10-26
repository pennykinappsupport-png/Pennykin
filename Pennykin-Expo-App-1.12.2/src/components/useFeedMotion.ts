import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { FEED_VISUAL_MS } from "../careChoreography";
import { FEED_MOTION_INPUT, FEED_BODY_PATH, FEED_BOWL_PATH, feedSnapshot } from "../feedChoreography";
import { feedTimeline, type FeedVisualValues } from "../feedTimeline";

export function createFeedVisuals(): FeedVisualValues<Animated.Value> {
  return { layers: [1, 0, 0, 0, 0].map((value) => new Animated.Value(value)), visibility: new Animated.Value(0), pickupScale: new Animated.Value(1), speechOpacity: new Animated.Value(0), speechScale: new Animated.Value(0.9) };
}

const nativeDriver = {
  delay: Animated.delay,
  timing: (value: Animated.Value, toValue: number, duration: number) => Animated.timing(value, { toValue, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
  spring: (value: Animated.Value, toValue: number) => Animated.spring(value, { toValue, stiffness: 280, damping: 15, mass: 0.65, useNativeDriver: true, isInteraction: false }),
  sequence: Animated.sequence,
  parallel: Animated.parallel,
};

export function useFeedMotion(active: boolean, id: string | undefined, paused: boolean, sharedProgress?: Animated.Value, sharedVisuals?: FeedVisualValues<Animated.Value>, onFinished?: (id: string) => void) {
  const localProgress = useRef(new Animated.Value(0)).current;
  const localVisuals = useRef<FeedVisualValues<Animated.Value> | null>(null);
  if (!localVisuals.current) localVisuals.current = createFeedVisuals();
  const visuals = sharedVisuals ?? localVisuals.current;
  const finish = useRef(onFinished);
  finish.current = onFinished;
  const progress = sharedProgress ?? localProgress;
  const position = useRef(0);
  const scope = active ? id ?? "feed-preview" : "idle";
  const currentScope = useRef(scope);
  const [snapshot, setSnapshot] = useState({ scope: "idle", ...feedSnapshot(0) });
  useLayoutEffect(() => {
    currentScope.current = scope;
    progress.stopAnimation(); position.current = 0; progress.setValue(0);
    if (active) {
      visuals.visibility.stopAnimation(); visuals.visibility.setValue(1);
      visuals.layers.forEach((value, index) => { value.stopAnimation(); value.setValue(index === 0 ? 1 : 0); });
      visuals.pickupScale.setValue(1); visuals.speechOpacity.setValue(0); visuals.speechScale.setValue(0.9);
    }
    setSnapshot({ scope, ...feedSnapshot(0) });
  }, [active, progress, scope, visuals]);

  useEffect(() => {
    if (!active) return;
    let live = true;
    let previous = feedSnapshot(position.current);
    const observe = ({ value }: { value: number }) => {
      if (!live || currentScope.current !== scope) return;
      position.current = value;
      const next = feedSnapshot(value);
      if (Object.keys(next).some((key) => next[key as keyof typeof next] !== previous[key as keyof typeof previous])) {
        previous = next; setSnapshot({ scope, ...next });
      }
    };
    setSnapshot({ scope, ...previous });
    const listener = progress.addListener(observe);
    return () => { live = false; progress.removeListener(listener); };
  }, [active, progress, scope]);

  useEffect(() => {
    if (!active) {
      // Keep the outgoing image views mounted even on an interrupted Feed.
      const exit = nativeDriver.timing(visuals.visibility, 0, 300);
      exit.start();
      return () => exit.stop();
    }
    if (paused || position.current >= 1) return;
    let live = true;
    const animation = Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: FEED_VISUAL_MS * (1 - position.current), easing: Easing.linear, useNativeDriver: true }),
      feedTimeline(nativeDriver, visuals, position.current * FEED_VISUAL_MS),
    ]);
    animation.start(({ finished }) => {
      if (live && finished && currentScope.current === scope) {
        position.current = 1; setSnapshot({ scope, ...feedSnapshot(1) });
        if (id) finish.current?.(id);
      }
    });
    return () => {
      live = false; animation.stop();
      progress.stopAnimation((value) => { if (currentScope.current === scope) position.current = value; });
    };
  }, [active, id, paused, progress, scope, visuals]);

  const ready = active && snapshot.scope === scope;
  return { progress, visuals, pose: ready ? snapshot.pose : null,
    complete: !ready || snapshot.complete,
    expecting: ready && snapshot.expecting,
    blinking: ready && snapshot.blinking,
    bowlVisible: ready && snapshot.bowlVisible };
}

export function feedRigTransform(progress: Animated.Value, size: number, pickupScale: Animated.Value) {
  return [
    { scale: pickupScale },
    { translateX: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BODY_PATH.map((p) => p.x * size) }) },
    { translateY: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BODY_PATH.map((p) => p.y * size) }) },
    { scaleX: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BODY_PATH.map((p) => p.sx) }) },
    { scaleY: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BODY_PATH.map((p) => p.sy) }) },
    { rotate: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BODY_PATH.map((p) => `${p.rotation}deg`) }) },
  ];
}

export function feedBowlTransform(progress: Animated.Value, size: number) {
  return [
    { translateX: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BOWL_PATH.map((p) => p.x * size) }) },
    { translateY: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BOWL_PATH.map((p) => p.y * size) }) },
    { scale: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BOWL_PATH.map((p) => p.scale) }) },
    { rotate: progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BOWL_PATH.map((p) => `${p.rotation}deg`) }) },
  ];
}

export function feedBowlOpacity(progress: Animated.Value) {
  return progress.interpolate({ inputRange: FEED_MOTION_INPUT, outputRange: FEED_BOWL_PATH.map((p) => p.opacity), extrapolate: "clamp" });
}
