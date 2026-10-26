const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('manual dog wake emits one light haptic; rerender, pause/resume and timeout cannot duplicate it',()=>{
 let cursor=0;const slots=[],effects=[],haptics=[];
 const hooks={useRef(initial){const n=cursor++;return slots[n]??={current:initial};},useEffect(fn,deps){const n=cursor++,old=slots[n];if(!old||deps.some((x,i)=>!Object.is(x,old.deps[i]))){effects.push(()=>{old?.cleanup?.();slots[n]={deps,cleanup:fn()};});}}};
 const player={pause(){},play(){},seekTo:async()=>{}};
 const modules={react:hooks,'expo-audio':{useAudioPlayer:()=>player,setAudioModeAsync:async()=>{}},'expo-haptics':{ImpactFeedbackStyle:{Light:'light'},impactAsync:style=>{haptics.push(style);return Promise.resolve();}}};
 const module={exports:{}};const source=ts.transpileModule(fs.readFileSync('src/components/RestFeedback.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInThisContext(`(function(require,module,exports){${source}})`)(name=>modules[name]??name,module,module.exports);
 function render(overrides){cursor=0;module.exports.RestFeedback({nativeDog:true,stage:'Rest_Exit',animationId:'nap',feedbackKey:0,wakeReason:'screenTap',paused:false,...overrides});while(effects.length)effects.shift()();}
 render();assert.deepEqual(haptics,['light']);render();render({paused:true});render();assert.deepEqual(haptics,['light']);
 render({animationId:'nap-2',wakeReason:'timeout'});assert.deepEqual(haptics,['light']);
});
