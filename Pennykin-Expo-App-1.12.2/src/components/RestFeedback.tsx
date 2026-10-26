import { useEffect, useRef } from "react";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import type { RestStage, RestWakeReason } from "../restChoreography";

export function RestFeedback({ stage, animationId, feedbackKey, wakeReason, paused, nativeDog=false, nativeRest=false }: {
  stage: RestStage | null; animationId?: string; feedbackKey: number;
  wakeReason: RestWakeReason | null; paused: boolean; nativeDog?:boolean; nativeRest?:boolean;
}) {
  const nativePlayback=nativeRest || nativeDog;
  const player = useAudioPlayer(require("../../assets/audio/rest-wake.wav"));
  const lastTouch = useRef("");
  const lastWakeHaptic=useRef("");
  useEffect(()=>{
    if(!nativePlayback || paused || stage!=="Rest_Exit" || !animationId || !wakeReason || wakeReason==="timeout" || lastWakeHaptic.current===animationId)return;
    lastWakeHaptic.current=animationId;void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
  },[nativePlayback,paused,stage,animationId,wakeReason]);
  const lastWake = useRef("");
  useEffect(() => {
    if (!animationId || !feedbackKey || stage !== "Rest_Loop" || paused) return;
    const key = `${animationId}:${feedbackKey}`;
    if (lastTouch.current === key) return;
    lastTouch.current = key;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [animationId, feedbackKey, paused, stage]);
  useEffect(() => {
    let live = true;
    if (paused || stage !== "Rest_Exit") { player.pause(); return; }
    if (!animationId || (wakeReason !== "doubleTap" && !(nativePlayback && wakeReason==="screenTap")) || lastWake.current === animationId) return;
    lastWake.current = animationId;
    void (async () => {
      await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, allowsRecording: false, interruptionMode: "mixWithOthers" });
      player.volume = 0.3;
      await player.seekTo(0);
      if (live) player.play();
    })().catch(() => {});
    return () => { live = false; player.pause(); };
  }, [animationId, paused, player, stage, wakeReason,nativePlayback]);
  return null;
}
