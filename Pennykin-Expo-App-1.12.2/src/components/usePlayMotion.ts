import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { PLAY_VISUAL_MS, PLAY_BODY_PATH, PLAY_INPUT, playSnapshot } from "../playChoreography";

import { ANIMAL_PLAY_BODY_PATH, ANIMAL_PLAY_INPUT, ANIMAL_PLAY_VISUAL_MS, animalPlaySnapshot } from "../animalPlayChoreography";
import type { PetType } from "../types";

export function usePlayMotion(active: boolean, id: string | undefined, paused: boolean, onMessage?: (id: string, message: string) => void, sharedProgress?: Animated.Value, type: PetType = "cat") {
  const duration = type === "cat" ? PLAY_VISUAL_MS : ANIMAL_PLAY_VISUAL_MS;
  const snapshotAt = type === "cat" ? playSnapshot : animalPlaySnapshot;
  const localProgress = useRef(new Animated.Value(0)).current;
  const progress = sharedProgress ?? localProgress;
  const position = useRef(0);
  const messageRef = useRef(onMessage);
  messageRef.current = onMessage;
  const scope = active ? id ?? "play-preview" : "idle";
  const scopeRef = useRef(scope);
  const [snapshot, setSnapshot] = useState({ scope: "idle", ...snapshotAt(0) });

  useLayoutEffect(() => {
    scopeRef.current = scope;
    // Reset state and native clock together before a new story can become
    // visible. A previous action's progress must never flash a floor toy.
    progress.stopAnimation(); position.current = 0; progress.setValue(0);
    setSnapshot({ scope, ...snapshotAt(0) });
  }, [scope, progress, snapshotAt]);

  useEffect(() => {
    if (!active) return;
    let live = true;
    let last = snapshotAt(position.current);
    let previousMessage = "";
    const observe = ({ value }: { value: number }) => {
      if (!live || scopeRef.current !== scope) return;
      position.current = value;
      const next = snapshotAt(value);
      if (next.pose !== last.pose || next.caught !== last.caught || next.complete !== last.complete) {
        last = next; setSnapshot({ scope, ...next });
      }
      if (next.message !== previousMessage && id) {
        previousMessage = next.message; messageRef.current?.(id, next.message);
      }
    };
    observe({ value: position.current });
    const listener = progress.addListener(observe);
    return () => { live = false; progress.removeListener(listener); };
  }, [active, id, progress, scope, snapshotAt]);

  useEffect(() => {
    if (!active || paused || position.current >= 1) return;
    let live = true;
    const animation = Animated.timing(progress, { toValue: 1,
      duration: duration * (1 - position.current), easing: Easing.linear, useNativeDriver: true });
    animation.start(({ finished }) => {
      if (finished && live && scopeRef.current === scope) {
        // Explicit completion clears pose, toy and stars even if the owner is
        // still spending its last milliseconds in the finishing phase.
        position.current = 1; setSnapshot({ scope, ...snapshotAt(1) });
      }
    });
    return () => {
      live = false; animation.stop();
      progress.stopAnimation((value) => { if (scopeRef.current === scope) position.current = value; });
    };
  }, [active, paused, progress, scope, duration, snapshotAt]);

  const ready = active && snapshot.scope === scope;
  return { progress, ready, pose: ready ? snapshot.pose : null,
    caught: ready && snapshot.caught, complete: !ready || snapshot.complete };
}

// Used by the main body and the foreground paw cutouts; identical transforms
// preserve contact without introducing another independent animation loop.
export function playRigTransform(progress: Animated.Value, size: number, type: PetType = "cat") {
  const input = type === "cat" ? PLAY_INPUT : ANIMAL_PLAY_INPUT;
  const path = type === "cat" ? PLAY_BODY_PATH : ANIMAL_PLAY_BODY_PATH;
  return [
    { translateX: progress.interpolate({ inputRange: input, outputRange: path.map((p) => p.x * size) }) },
    { translateY: progress.interpolate({ inputRange: input, outputRange: path.map((p) => p.y * size) }) },
    { rotate: progress.interpolate({ inputRange: input, outputRange: path.map((p) => `${p.rotation}deg`) }) },
    { scaleX: progress.interpolate({ inputRange: input, outputRange: path.map((p) => p.sx) }) },
    { scaleY: progress.interpolate({ inputRange: input, outputRange: path.map((p) => p.sy) }) },
  ];
}
