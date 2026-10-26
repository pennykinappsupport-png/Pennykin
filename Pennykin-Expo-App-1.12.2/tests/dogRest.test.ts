import assert from "node:assert/strict";
import test from "node:test";
import {createDogRestPlayback,DOG_REST_SEGMENTS,type RestPlayer} from "../src/dogRest";
import {initialPetAnimationState,petAnimationReducer as reduce,phaseDurationMs,restStageFor,type PetAnimationRequest} from "../src/petAnimationMachine";
const request:PetAnimationRequest={id:"dog-nap",state:"sleeping",rest:true,restNative:true,message:"sleepy",durationMs:31800,priority:"interaction"};
const begin=()=>reduce(initialPetAnimationState,{type:"REQUEST",request});
const loop=()=>reduce(begin(),{type:"REST_NATIVE_FINISHED",id:request.id,stage:"Rest_Enter"});
test("dog Rest entry/exit wait for native completion; only the 30s sleep limit uses the FSM timer",()=>{
 let s=begin();assert.equal(phaseDurationMs(s),null);assert.equal(reduce(s,{type:"ADVANCE"}),s);
 s=reduce(s,{type:"REST_NATIVE_FINISHED",id:request.id,stage:"Rest_Enter"});assert.equal(restStageFor(s),"Rest_Loop");assert.equal(phaseDurationMs(s),30000);
 s=reduce(s,{type:"ADVANCE"});assert.equal(restStageFor(s),"Rest_Exit");assert.equal(s.restWakeReason,"timeout");assert.equal(phaseDurationMs(s),null);
 assert.equal(reduce(s,{type:"ADVANCE"}),s);
 s=reduce(s,{type:"REST_NATIVE_FINISHED",id:request.id,stage:"Rest_Exit"});assert.deepEqual(s,initialPetAnimationState);
});
test("screen tap wakes only the dog sleep loop and queued care waits for the complete wake animation",()=>{
 assert.equal(reduce(begin(),{type:"WAKE_REST",id:request.id,reason:"screenTap"}).phase,"starting");
 const asleep=loop();let s=reduce(asleep,{type:"WAKE_REST",id:request.id,reason:"screenTap"});assert.equal(s.phase,"finishing");assert.equal(s.restWakeReason,"screenTap");
 assert.equal(reduce(s,{type:"WAKE_REST",id:request.id,reason:"screenTap"}),s);
 s=reduce(asleep,{type:"REQUEST",request:{id:"feed",state:"eating",message:"feed",durationMs:3000,priority:"interaction"}});
 assert.equal(s.active?.id,request.id);assert.deepEqual(s.queue.map(x=>x.id),["feed"]);
 s=reduce(s,{type:"REST_NATIVE_FINISHED",id:request.id,stage:"Rest_Exit"});assert.equal(s.active?.id,"feed");
});
test("native stage finishes are scoped by request/stage and survive background delivery without replay",()=>{
 let s=begin();assert.equal(reduce(s,{type:"REST_NATIVE_FINISHED",id:"old",stage:"Rest_Enter"}),s);
 s=reduce(s,{type:"PAUSE"});s=reduce(s,{type:"REST_NATIVE_FINISHED",id:request.id,stage:"Rest_Enter"});assert.equal(s.phase,"paused");assert.equal(s.resumePhase,"playing");
 s=reduce(s,{type:"RESUME"});assert.equal(restStageFor(s),"Rest_Loop");
 assert.equal(reduce(s,{type:"REST_NATIVE_FINISHED",id:request.id,stage:"Rest_Enter"}),s);
 s=reduce(s,{type:"WAKE_REST",id:request.id,reason:"screenTap"});s=reduce(s,{type:"PAUSE"});s=reduce(s,{type:"REST_NATIVE_FINISHED",id:request.id,stage:"Rest_Exit"});assert.equal(s.active,null);
});
test("native segment playback waits for a ready view, loops 30 frames and rejects stale finish callbacks",()=>{
 let now=0,view:RestPlayer|null=null;const calls:string[]=[];
 const native:RestPlayer={play:(a,b)=>calls.push(`play:${a}:${b}`),pause:()=>calls.push("pause"),resume:()=>calls.push("resume"),reset:()=>calls.push("reset")};
 const p=createDogRestPlayback(()=>view,()=>now);p.sync("nap","Rest_Enter",false,true);assert.equal(calls.length,0);
 view=native;p.sync("nap","Rest_Enter",false,false);assert.ok(!calls.includes("play:0:15"));p.sync("nap","Rest_Enter",false,true);assert.equal(calls.at(-1),"play:0:15");
 now=100;assert.equal(p.finish("nap","Rest_Enter",false),false);now=1000;assert.equal(p.finish("nap","Rest_Enter",false),true);assert.equal(p.finish("nap","Rest_Enter",false),false);
 p.sync("nap","Rest_Loop",false,true);assert.equal(calls.at(-1),"play:15:45");now=31000;assert.equal(p.finish("nap","Rest_Loop",false),false);
 p.sync("nap","Rest_Exit",false,true);assert.equal(calls.at(-1),"play:45:57");assert.equal(p.finish("nap","Rest_Exit",false),false);now=31800;assert.equal(p.finish("nap","Rest_Exit",true),false);assert.equal(p.finish("nap","Rest_Exit",false),true);
 assert.equal(DOG_REST_SEGMENTS.Rest_Exit.duration,800);
});
test("background pauses a native segment in place; Strict Mode cleanup/resume does not restart frames",()=>{
 let now=0;const calls:string[]=[];const p=createDogRestPlayback(()=>({play:(a,b)=>calls.push(`play:${a}:${b}`),pause:()=>calls.push("pause"),resume:()=>calls.push("resume"),reset:()=>calls.push("reset")}),()=>now);
 p.sync("nap","Rest_Enter",false,true);now=400;p.sync("nap","Rest_Enter",true,true);now=10400;p.sync("nap","Rest_Enter",false,true);assert.equal(calls.at(-1),"resume");
 assert.equal(p.finish("nap","Rest_Enter",false),false);now=11000;assert.equal(p.finish("nap","Rest_Enter",false),true);
 p.sync("nap","Rest_Loop",false,true);p.dispose();p.activate();p.sync("nap","Rest_Loop",false,true);assert.equal(calls.at(-1),"resume");assert.equal(calls.filter(x=>x==="play:15:45").length,1);
});
