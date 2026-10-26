import type { RestStage } from "./restChoreography";

export const DOG_REST_SEGMENTS: Record<RestStage, {start:number;end:number;duration:number;loop:boolean}> = {
  Rest_Enter:{start:0,end:15,duration:1000,loop:false},
  Rest_Loop:{start:15,end:45,duration:2000,loop:true},
  Rest_Exit:{start:45,end:57,duration:800,loop:false},
};
export interface RestPlayer { play(start:number,end:number):void;pause():void;resume():void;reset():void; }
// Native Lottie owns frames and loops. This clock only rejects stale finish
// events; it never schedules or renders a frame, nor completes a stage itself.
export function createDogRestPlayback(player:()=>RestPlayer|null,now=()=>Date.now()) {
 let scope="",stage:RestStage|null=null,started=false,paused=false,complete=false,disposed=false;
 let elapsed=0,since=0;
 const pause=()=>{if(started&&!paused&&!complete){elapsed+=Math.max(0,now()-since);player()?.pause();paused=true;}};
 return {
  activate(){disposed=false;},
  sync(id:string|undefined,next:RestStage|null,shouldPause:boolean,ready:boolean){
   if(disposed)return;
   const key=`${id??"idle"}:${next??"idle"}`;
   if(scope!==key){player()?.pause();player()?.reset();scope=key;stage=next;started=false;paused=false;complete=false;elapsed=0;}
   if(!next||!ready||complete)return;
   if(shouldPause){pause();return;}
   const view=player();if(!view)return;
   if(!started){const segment=DOG_REST_SEGMENTS[next];view.play(segment.start,segment.end);started=true;since=now();paused=false;}
   else if(paused){view.resume();since=now();paused=false;}
  },
  finish(id:string|undefined,current:RestStage|null,cancelled:boolean){
   if(disposed||cancelled||!current||current==="Rest_Loop"||stage!==current||scope!==`${id??"idle"}:${current}`||!started||complete)return false;
   const played=elapsed+(paused?0:Math.max(0,now()-since));
   if(played<DOG_REST_SEGMENTS[current].duration-100)return false;
   complete=true;return true;
  },
  dispose(){pause();disposed=true;},
 };
}
