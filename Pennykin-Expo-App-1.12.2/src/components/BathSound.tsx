import { useEffect, useRef } from "react";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";

// A bundled, quiet foley track; never asks for microphone or background audio.
// No audio status event drives the visual clock.
export function BathSound({ visible, paused }: { visible: boolean; paused: boolean }) {
  const player = useAudioPlayer(require("../../assets/audio/bath.wav"));
  const started = useRef(false);
  useEffect(() => {
    let live = true;
    if(!visible) { player.pause(); started.current=false; return; }
    if(paused) { player.pause(); return; }
    void (async()=>{
      await setAudioModeAsync({playsInSilentMode:false,shouldPlayInBackground:false,allowsRecording:false,interruptionMode:"mixWithOthers"});
      if(!live)return;
      player.volume=.22;
      if(!started.current) await player.seekTo(0);
      if(live){started.current=true;player.play();}
    })().catch(()=>{});
    return ()=>{live=false;player.pause();};
  },[visible,paused,player]);
  return null;
}
