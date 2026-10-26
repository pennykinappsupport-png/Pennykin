import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";
import type { PetType } from "../types";
import { BATH_SOURCES } from "../bathSources";
import { createBathPlayback } from "../bathPlayback";
import { BathSound } from "./BathSound";

export function CleanArt({type,size,visible,paused=false,runId="bath-preview",onReady,onError,onFinished,getProgress}: {
  type:PetType;size:number;visible:boolean;paused?:boolean;runId?:string;
  onReady:()=>void;onError:()=>void;onFinished:()=>void;getProgress:()=>number;
}) {
  const player=useRef<LottieView>(null);
  const playback=useRef(createBathPlayback(()=>player.current)).current;
  const announced=useRef(false);
  const failed=useRef(false);
  const callbacks=useRef({onReady,onError,onFinished,getProgress});
  callbacks.current={onReady,onError,onFinished,getProgress};
  const markReady=()=>{
    if(announced.current)return;
    announced.current=true;callbacks.current.onReady();
  };
  useEffect(()=>{playback.activate();return()=>playback.dispose();},[playback]);
  useEffect(()=>{playback.sync(runId,visible,paused);},[playback,runId,visible,paused]);
  return <View testID="clean-scene" collapsable={false} pointerEvents="none" accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={[styles.scene,{width:size,height:size,opacity:visible?1:0}]}>
    <BathSound visible={visible} paused={paused}/>
    <LottieView ref={player} testID="clean-lottie" source={BATH_SOURCES[type]} autoPlay={false} loop={false}
      speed={1} resizeMode="contain" cacheComposition renderMode="AUTOMATIC"
      style={[styles.film,{width:size*1.55,height:size*1.55,left:-size*.275,top:-size*.35}]}
      onLayout={event=>{
        const {width,height}=event.nativeEvent.layout;
        if(width<=0||height<=0||failed.current)return;
        // Lottie 7.3.x iOS can register animationLoaded after synchronous JSON
        // loading. A mounted, sized local view must not wait for that event.
        markReady();playback.sync(runId,visible,paused);
      }}
      onAnimationLoaded={()=>{failed.current=false;markReady();playback.sync(runId,visible,paused);}}
      onAnimationFailure={()=>{failed.current=true;announced.current=false;callbacks.current.onError();}}
      onAnimationFinish={cancelled=>{
        if(playback.finish(runId,cancelled,callbacks.current.getProgress()))callbacks.current.onFinished();
      }}/>
  </View>;
}
const styles=StyleSheet.create({
  scene:{position:"absolute",left:0,top:0},
  // The character fills 65% of its 1024 canvas. Scale the film to match the
  // room avatar while keeping shower/reward space above it, and paws on floor.
  film:{position:"absolute"},
});
