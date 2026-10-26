import assert from 'node:assert/strict';
import test from 'node:test';
import {CLEAN_FPS,CLEAN_FRAME_COUNT,CLEAN_VISUAL_MS,CLEAN_DURATION_MS,CLEAN_CANVAS,CLEAN_STAGE_FRAMES,cleanStage,cleanSnapshot} from '../src/cleanChoreography';
import {createBathPlayback} from '../src/bathPlayback';

test('bath film is exactly 5s, 75 frames, 15fps on a 1024 vector canvas',()=>{
  assert.equal(CLEAN_FPS,15);assert.equal(CLEAN_FRAME_COUNT,75);assert.equal(CLEAN_VISUAL_MS,5000);
  assert.equal(CLEAN_DURATION_MS,5000);assert.equal(CLEAN_CANVAS,1024);
  assert.deepEqual(CLEAN_STAGE_FRAMES.map(([f])=>f),[0,7,25,43,61,70]);
  for(const [frame,stage]of CLEAN_STAGE_FRAMES)assert.equal(cleanStage(frame*1000/15),stage);
  assert.equal(cleanSnapshot(1).frame,74);assert.equal(cleanSnapshot(1).complete,true);
});
function playback(){
  const calls:string[]=[];const native={play:()=>calls.push('play'),pause:()=>calls.push('pause'),resume:()=>calls.push('resume'),reset:()=>calls.push('reset')};
  return {calls,p:createBathPlayback(()=>native)};
}
test('native Lottie preloads hidden, starts once and resumes instead of restarting',()=>{
  const {p,calls}=playback();p.sync('one',false,false);assert.deepEqual(calls,['pause','reset']);
  p.sync('one',true,false);p.sync('one',true,false);assert.equal(calls.filter(c=>c==='play').length,1);
  p.sync('one',true,true);p.sync('one',true,true);assert.equal(calls.at(-1),'pause');
  p.sync('one',true,false);assert.equal(calls.at(-1),'resume');
  assert.equal(calls.filter(c=>c==='play').length,1);
});
test('cancelled and stale finish events do not complete a new action; real completion fires once',()=>{
  const {p}=playback();p.sync('one',true,false);
  assert.equal(p.finish('one',true,1),false);assert.equal(p.finish('one',false,.3),false);
  p.sync('two',true,false);assert.equal(p.finish('one',false,1),false);assert.equal(p.finish('two',false,.02),false);
  assert.equal(p.finish('two',false,1),true);assert.equal(p.finish('two',false,1),false);
});
test('background start waits; a queued real finish can complete while paused; unmount retires callbacks',()=>{
  const {p,calls}=playback();p.sync('one',true,true);assert.ok(!calls.includes('play'));
  p.sync('one',true,false);assert.equal(calls.at(-1),'play');
  p.sync('one',true,true);assert.equal(p.finish('one',false,1),true);
  p.dispose();assert.equal(p.finish('one',false,1),false);
});
test('effect replay can reactivate the resident native controller',()=>{
  const {p,calls}=playback();p.sync('one',false,false);p.dispose();p.activate();p.sync('two',true,false);
  assert.equal(calls.at(-1),'play');assert.equal(p.finish('two',false,1),true);
});

test('Strict Mode effect replay resumes an already started native view',()=>{
 const {p,calls}=playback();p.sync('one',true,false);p.dispose();p.activate();p.sync('one',true,false);
 assert.equal(calls.at(-1),'resume');assert.equal(calls.filter(c=>c==='play').length,1);
});

test('missing native ref leaves playback pending instead of marking the request started',()=>{
 const calls:string[]=[];let native:any=null;
 const p=createBathPlayback(()=>native);p.sync('one',true,false);
 native={play:()=>calls.push('play'),pause(){},resume:()=>calls.push('resume'),reset(){}};
 p.sync('one',true,false);assert.deepEqual(calls,['play']);
});
