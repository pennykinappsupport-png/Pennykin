import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { CLEAN_VISUAL_MS, cleanMessage } from "../cleanChoreography";

export function useCleanMotion(active: boolean, id: string | undefined, paused: boolean,
  sharedProgress?: Animated.Value, onMessage?: (id: string, message: string) => void,
  onComplete?: (id: string) => void) {
  const localProgress = useRef(new Animated.Value(0)).current;
  const progress = sharedProgress ?? localProgress;
  const position = useRef(0);
  const completedId = useRef("");
  const messageRef = useRef(onMessage), completeRef = useRef(onComplete);
  messageRef.current = onMessage; completeRef.current = onComplete;
  const scope = active ? id ?? "clean-preview" : "idle";
  const scopeRef = useRef(scope);
  // React tracks lifecycle only, never sprite cells or per-frame values.
  const [status, setStatus] = useState({ scope: "idle", complete: false });
  useLayoutEffect(() => {
    scopeRef.current = scope;
    progress.stopAnimation(); position.current = 0; progress.setValue(0);
    completedId.current = "";
    setStatus({ scope, complete: false });
  }, [scope, progress]);
  useEffect(() => {
    if (!active) return;
    let live = true, previousMessage = "";
    const observe = ({ value }: { value: number }) => {
      if (!live || scopeRef.current !== scope) return;
      position.current = value;
      const message = cleanMessage(value * CLEAN_VISUAL_MS);
      // The native room clock updates chrome without per-frame React renders.
      // Lottie runs independently; React only receives phase messages.
      // Completion comes from the native Lottie view, via finish().
      if (message !== previousMessage && id) {
        previousMessage = message; messageRef.current?.(id, message);
      }
    };
    observe({ value: position.current });
    const listener = progress.addListener(observe);
    return () => { live = false; progress.removeListener(listener); };
  }, [active, id, scope, progress]);
  useEffect(() => {
    if (!active || paused || position.current >= 1) return;
    let live = true;
    const animation = Animated.timing(progress, { toValue: 1,
      duration: CLEAN_VISUAL_MS * (1 - position.current), easing: Easing.linear, useNativeDriver: true });
    animation.start(({ finished }) => {
      if (!finished || !live || scopeRef.current !== scope) return;
      // This clock only drives room chrome and dialogue. Lottie may finish
      // a few milliseconds later; its native callback commits completion.
      position.current = 1;
    });
    return () => {
      live = false; animation.stop();
      progress.stopAnimation(value => { if (scopeRef.current === scope) position.current = value; });
    };
  }, [active, paused, id, scope, progress]);
  const ready = active && status.scope === scope;
  const finish = () => {
    if(!active || scopeRef.current!==scope || completedId.current===scope)return;
    completedId.current=scope;
    progress.stopAnimation(); position.current=1; progress.setValue(1);
    setStatus({scope,complete:true});
    if(id)completeRef.current?.(id);
  };
  return { progress, ready, complete: !ready || status.complete, finish, getProgress:()=>position.current };
}
