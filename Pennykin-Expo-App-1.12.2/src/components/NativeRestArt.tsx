import React,{useEffect,useRef} from "react";
import {View,StyleSheet} from "react-native";
import LottieView from "lottie-react-native";
import type {PetType} from "../types";
import {REST_SOURCES} from "../restSources";
import type {RestStage} from "../restChoreography";
import {createDogRestPlayback} from "../dogRest";

export function NativeRestArt({type="dog",size,stage,runId,paused,onStageFinished,onError}:{
 type?:PetType;size:number;stage:RestStage|null;runId?:string;paused:boolean;
 onStageFinished?:(id:string,stage:RestStage)=>void;onError?:(id:string)=>void;
}){
 const player=useRef<LottieView>(null),ready=useRef(false),failed=useRef(false);
 const playback=useRef(createDogRestPlayback(()=>player.current)).current;
 const props=useRef({stage,runId,paused,onStageFinished,onError});props.current={stage,runId,paused,onStageFinished,onError};
 const sync=()=>{const p=props.current;playback.sync(p.runId,p.stage,p.paused,ready.current&&!failed.current);};
 useEffect(()=>{playback.activate();return()=>playback.dispose();},[playback]);
 useEffect(()=>{sync();if(stage&&runId&&failed.current)props.current.onError?.(runId);},[stage,runId,paused,playback]);
 const markReady=()=>{ready.current=true;failed.current=false;sync();};
 return <View pointerEvents="none" collapsable={false} testID={`${type}-rest-scene`} style={[styles.scene,{width:size,height:size,opacity:stage?1:0}]}>
  <LottieView ref={player} testID={`${type}-rest-lottie`} source={REST_SOURCES[type]} autoPlay={false} loop={stage==="Rest_Loop"} cacheComposition renderMode="AUTOMATIC"
   resizeMode="contain" speed={1} style={{position:"absolute",width:size*1.55,height:size*1.55,left:-size*.275,top:-size*.35}}
   onLayout={event=>{const {width,height}=event.nativeEvent.layout;if(width>0&&height>0&&!failed.current){ready.current=true;sync();}}}
   onAnimationLoaded={markReady}
   onAnimationFailure={()=>{ready.current=false;failed.current=true;const p=props.current;if(p.runId&&p.stage)p.onError?.(p.runId);}}
   onAnimationFinish={cancelled=>{const p=props.current;if(playback.finish(p.runId,p.stage,cancelled)&&p.runId&&p.stage)p.onStageFinished?.(p.runId,p.stage);}}/>
 </View>;
}
const styles=StyleSheet.create({scene:{position:"absolute",left:0,top:0}});
