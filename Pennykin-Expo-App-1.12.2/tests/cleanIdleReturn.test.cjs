const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const React=require('react');
const {petAnimationReducer:reduce,initialPetAnimationState,restStageFor}=require('../.test-build/src/petAnimationMachine.js');
const {CLEAN_DURATION_MS}=require('../.test-build/src/cleanChoreography.js');

// Evaluate the real HomeScreen completion callback and RoomScene's actual
// PetAvatar props at 20:30. The deterministic adapter replaces native widgets
// and data access, not either screen's decision logic.
function fixture(petType="dog"){
  const alerts=[];
  let cursor=0,slots=[],machine=reduce(initialPetAnimationState,{type:'REQUEST',request:{
    id:'clean-1',state:'bathing',manual:true,priority:'interaction',durationMs:CLEAN_DURATION_MS,message:'All dry and fluffy!'}});
  machine=reduce(machine,{type:'ADVANCE'});
  const hooks={...React,useMemo:fn=>fn(),useRef(initial){const i=cursor++;return slots[i]??={current:initial};},
    useState(initial){const i=cursor++;slots[i]??={value:typeof initial==='function'?initial():initial};return [slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v;}];},
    useCallback(fn){return fn;},useEffect(){}};
  const snapshot={pet:{sleepingSince:null,coins:100,premiumTreats:0},settings:{lastCheckinDate:'2026-10-06',petType,petName:'Pip'},
    pendingGifts:[],financialActuals:{todayCount:0},savingsGoal:null,equippedItems:{}};
  class Value{constructor(value){this.value=value;}interpolate(){return 1;}}
  const native={Animated:{Value,View:'Animated.View'},View:'View',Pressable:'Pressable',ScrollView:'ScrollView',Modal:'Modal',Text:'Text',StyleSheet:{create:s=>s},Alert:{alert(...args){alerts.push(args);}}};
  const modules={
    react:hooks,'react-native':native,
    '../artworkLoader':{preloadBathArtwork:()=>Promise.resolve()},
    '../AppContext':{useApp:()=>({snapshot})},
    '../budget':{getBudgetMetrics:()=>({safeTodayCents:0,remainingBudgetCents:0,remainingDays:1})},
    '../date':{todayKey:()=> '2026-10-06',formatMoney:String},
    '../reactions':{getPetMoment:()=>({message:'Hello',state:'calm'})},
    '../theme':{colors:{},spacing:{}},
    '../game':{stageForLevel:()=> 'Young',actionInfo:Object.fromEntries(['feed','play','clean','rest','vet'].map(k=>[k,{emoji:k,label:k,detail:''}]))},
    '../usePetAnimationMachine':{usePetAnimationMachine:opts=>({active:machine.active,phase:machine.phase,restStage:restStageFor(machine),
      visualState:machine.active?.state??opts.fallbackState,message:machine.active?.message??opts.fallbackMessage,
      cancelById:id=>{machine=reduce(machine,{type:'CANCEL_ID',id});},
      finishManual:id=>{machine=reduce(machine,{type:'FINISH_MANUAL',id});},
      isPaused:machine.phase==='paused',
      wakeRest:reason=>{machine=reduce(machine,{type:'WAKE_REST',id:machine.active?.id,reason});},
      finishRestStage:(id,stage)=>{machine=reduce(machine,{type:'REST_NATIVE_FINISHED',id,stage});}})},
    '../useVetVisit':{useVetVisit:()=>({visit:null,visitRef:{current:null}})},
    '../careMutationQueue':{createCareMutationQueue:()=>({})},
    '../restChoreography':require('../.test-build/src/restChoreography.js'),
    '../playChoreography':require('../.test-build/src/playChoreography.js'),
    '../animalPlayChoreography':require('../.test-build/src/animalPlayChoreography.js'),
    '../careChoreography':require('../.test-build/src/careChoreography.js'),
    '../cleanChoreography':require('../.test-build/src/cleanChoreography.js'),
    '../components/RoomScene':{RoomScene:'RoomScene'},
    './PetAvatar':{PetAvatar:'PetAvatar'},
    './useFeedMotion':{createFeedVisuals:()=>({speechOpacity:1,speechScale:1})},
    '../collectibles':{getCollectible:()=>undefined},
  };
  function load(file){
    const module={exports:{}};
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true},fileName:file}).outputText;
    const requireStub=name=>modules[name]??new Proxy({},{get:(_,key)=>String(key)});
    const NightDate=class extends Date{getHours(){return 20;}};
    vm.runInThisContext(`(function(require,module,exports,Date){${output}\n})`,{filename:file})(requireStub,module,module.exports,NightDate);
    return module.exports;
  }
  const {HomeScreen}=load(path.resolve(__dirname,'../src/screens/HomeScreen.tsx'));
  const {RoomScene}=load(path.resolve(__dirname,'../src/components/RoomScene.tsx'));
  function flatten(node,result=[]){if(!node||typeof node!=='object')return result;result.push(node);React.Children.forEach(node.props?.children,c=>flatten(c,result));return result;}
  return {
    render(){cursor=0;const home=HomeScreen({navigate(){}});const room=flatten(home).find(n=>n.type==='RoomScene');cursor=100;
      const avatar=flatten(RoomScene(room.props)).find(n=>n.type==='PetAvatar');return {room,avatar,nodes:flatten(home)};},
    startRest(){machine=reduce(initialPetAnimationState,{type:'REQUEST',request:{id:'dog-nap',state:'sleeping',rest:true,restNative:true,durationMs:31800,priority:'interaction',message:'sleepy'}});machine=reduce(machine,{type:'REST_NATIVE_FINISHED',id:'dog-nap',stage:'Rest_Enter'});},
    pause(){machine=reduce(machine,{type:'PAUSE'});},
    resume(){machine=reduce(machine,{type:'RESUME'});},
    get machine(){return machine;},get alerts(){return alerts;},
    idle(){machine=reduce(machine,{type:'ADVANCE'});},
  };
}
test('after a completed Clean at night, the real room returns to awake idle and has no Rest_Loop',()=>{
  const f=fixture(),before=f.render();assert.equal(before.avatar.props.state,'bathing');
  before.room.props.onCleanComplete('clean-1');assert.equal(f.machine.phase,'finishing');
  f.idle();const after=f.render();
  assert.equal(f.machine.phase,'idle');assert.equal(f.machine.active,null);
  assert.equal(after.room.props.allowNightSleep,false);assert.equal(after.avatar.props.state,'calm');assert.equal(after.avatar.props.restStage,null);
  assert.equal(f.render().avatar.props.state,'calm','subsequent renders must remain awake');
});
test('stale Clean completion cannot finish another scene or set an awake override',()=>{
  const f=fixture(),room=f.render().room;room.props.onCleanComplete('cancelled-clean');
  assert.equal(f.machine.phase,'playing');assert.equal(f.render().room.props.allowNightSleep,true);
});

test('a current Clean failure cancels the action and informs the user instead of staying silently busy',()=>{
 const f=fixture();f.render().room.props.onCleanError('clean-1');
 assert.equal(f.machine.active,null);assert.equal(f.alerts.length,1);
});
test('stale Clean failures cannot cancel another active request or display a misleading alert',()=>{
 const f=fixture();f.render().room.props.onCleanError('old-clean');assert.equal(f.machine.active.id,'clean-1');assert.equal(f.alerts.length,0);
});


test('dog Rest has a screen-wide wake target, exits natively once, then restores awake room at night',()=>{
 const f=fixture();f.startRest();let screen=f.render();
 assert.equal(screen.avatar.props.restStage,'Rest_Loop');
 const overlay=screen.nodes.find(n=>n.props?.testID==='rest-wake-overlay');assert.equal(overlay.props.visible,true);
 const target=screen.nodes.find(n=>n.props?.testID==='rest-wake-target');assert.equal(target.props.disabled,false);target.props.onPress();
 assert.equal(f.machine.phase,'finishing');assert.equal(f.machine.restWakeReason,'screenTap');
 screen=f.render();assert.equal(screen.nodes.find(n=>n.props?.testID==='rest-wake-overlay').props.visible,false);
 screen.room.props.onRestStageFinished('old-nap','Rest_Exit');assert.equal(f.machine.phase,'finishing');
 screen.room.props.onRestStageFinished('dog-nap','Rest_Exit');assert.equal(f.machine.active,null);
 screen=f.render();assert.equal(screen.avatar.props.restStage,null);assert.equal(screen.avatar.props.state,'calm');assert.equal(screen.room.props.allowNightSleep,false);
});
test('background sleep disables the screen-wide wake target and ignores activation',()=>{
 const f=fixture();f.startRest();f.pause();const screen=f.render();
 const target=screen.nodes.find(n=>n.props?.testID==='rest-wake-target');assert.equal(target.props.disabled,true);target.props.onPress();assert.equal(f.machine.phase,'paused');
});

for(const type of ['cat','rabbit'])test(`${type} Rest uses full-screen waking and native completion, with pause protection and awake return`,()=>{
 const f=fixture(type);f.startRest();let screen=f.render();assert.equal(screen.avatar.props.type,type);assert.equal(screen.avatar.props.restStage,'Rest_Loop');
 assert.equal(screen.nodes.find(n=>n.props?.testID==='rest-wake-overlay').props.visible,true);
 f.pause();screen=f.render();const paused=screen.nodes.find(n=>n.props?.testID==='rest-wake-target');assert.equal(paused.props.disabled,true);paused.props.onPress();assert.equal(f.machine.phase,'paused');
 f.resume();screen=f.render();screen.nodes.find(n=>n.props?.testID==='rest-wake-target').props.onPress();assert.equal(f.machine.phase,'finishing');assert.equal(f.machine.restWakeReason,'screenTap');
 screen=f.render();assert.equal(screen.nodes.find(n=>n.props?.testID==='rest-wake-overlay').props.visible,false);
 screen.room.props.onRestStageFinished('dog-nap','Rest_Exit');assert.equal(f.machine.active,null);
 screen=f.render();assert.equal(screen.avatar.props.state,'calm');assert.equal(screen.avatar.props.restStage,null);assert.equal(screen.room.props.allowNightSleep,false);
});
