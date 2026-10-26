const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs');
const {fixture,flatten}=require('./helpers/cleanFixture.cjs');
const {CLEAN_VISUAL_MS:visual}=require('../.test-build/src/cleanChoreography.js');

test('ambient UI runs on a native clock; only native Lottie completion can finish care',()=>{
 const f=fixture();assert.equal(f.calls.length,1);assert.equal(f.calls[0].duration,5000);assert.equal(f.calls[0].useNativeDriver,true);
 f.advance(visual);assert.deepEqual(f.completed,[]);assert.equal(f.update(true).complete,false);
 f.nativeFinish();assert.deepEqual(f.completed,['clean-1']);assert.equal(f.update(true).complete,true);
 f.nativeFinish();assert.deepEqual(f.completed,['clean-1']);
});
test('background freezes room clock and resume keeps remaining time; cancellation resets a new run',()=>{
 const f=fixture();f.advance(2300);const before=f.progress.value;
 f.update(true,true);f.advance(4000);assert.equal(f.progress.value,before);
 f.update(true,false);assert.equal(f.calls.at(-1).duration,2700);
 f.advance(6700);assert.deepEqual(f.completed,[]);f.nativeFinish();assert.deepEqual(f.completed,['clean-1']);
 f.update(false);assert.equal(f.progress.value,0);f.update(true,false,'clean-2');assert.equal(f.progress.value,0);
 f.advance(11700);f.nativeFinish();assert.deepEqual(f.completed,['clean-1','clean-2']);
});
test('progress updates never write per-frame React state',()=>{
 const f=fixture(),initial=f.stateWrites;
 for(let ms=1000/60;ms<visual;ms+=1000/60)f.advance(ms);
 assert.equal(f.stateWrites,initial);assert.equal(f.calls.length,1);assert.equal(f.messages.length,6);
});
test('actual Clean JSX mounts one resident Lottie with explicit load, error and finish callbacks',()=>{
 const f=fixture();let loaded=0,failed=0,finished=0;
 const nodes=flatten(f.renderArt({onReady:()=>loaded++,onError:()=>failed++,onFinished:()=>finished++}));
 const lottie=nodes.find(n=>n.type==='LottieView');assert.ok(lottie);assert.equal(lottie.props.loop,false);assert.equal(lottie.props.autoPlay,false);
 assert.equal(lottie.props.source.fr,15);assert.equal(lottie.props.source.op,75);assert.equal(lottie.props.cacheComposition,true);
 assert.ok(!Object.hasOwn(lottie.props,'progress'),'Lottie is autonomous, not driven from the JS thread');
 assert.ok(!nodes.some(n=>n.type==='Animated.Image'||n.type==='Image'));
 lottie.props.onAnimationLoaded();assert.equal(loaded,1);lottie.props.onAnimationFailure('bad');assert.equal(failed,1);
 assert.equal(finished,0);
});
test('all compositions retain exact original artwork with independently animated image layers',()=>{
 for(const type of ['dog','cat','rabbit']){
  const data=JSON.parse(fs.readFileSync(`assets/animation/bath-original/${type}.json`));
  assert.equal(data.w,1024);assert.equal(data.h,1024);assert.equal(data.op/data.fr,5);assert.equal(data.assets.length,3);
  for(const [id,file]of [['base',`assets/pets/${type}.png`],['blink',`assets/pets/${type}-blink.png`],['mouth',`assets/animation/${type}-eat.png`]]){
   const image=data.assets.find(a=>a.id===id);assert.equal(image.w,600);assert.equal(image.h,640);
   assert.deepEqual(Buffer.from(image.p.split(',')[1],'base64'),fs.readFileSync(file),'character pixels must be the original files');
  }
  assert.ok(data.layers.every(l=>[2,3,4].includes(l.ty)));
  for(const l of data.layers.filter(l=>l.ty===2)){assert.equal(l.hasMask,true);assert.ok(l.masksProperties.length>0);}
  assert.ok(!data.layers.some(l=>l.nm==='Head silhouette'||l.nm==='Torso'),'rejected cartoon geometry must not ship');
  const head=data.layers.find(l=>l.nm.startsWith('HEAD •'));
  const value=t=>head.ks.r.k.find(k=>k.t===t).s[0];
  assert.equal(value(63),-60);assert.equal(value(64),-60);assert.equal(value(66),60);assert.equal(value(67),60);
  const body=data.layers.find(l=>l.nm.startsWith('BODY •'));assert.equal(head.parent,body.ind);
  assert.ok(data.layers.some(l=>l.nm.includes('REWARD')));assert.ok(data.layers.some(l=>l.nm.includes('TAIL')));
  const first=body.ks.r.k.filter(k=>k.t>=25&&k.t<=42).map(k=>[k.t-25,k.s[0]]);
  const second=body.ks.r.k.filter(k=>k.t>=43&&k.t<=60).map(k=>[k.t-43,k.s[0]]);assert.deepEqual(first,second);
 }
});
test('dedicated legacy Clean resources and render path are removed',()=>{
 assert.equal(fs.existsSync('assets/animation/clean-v2'),false);assert.equal(fs.existsSync('assets/animation/clean-v3'),false);
 assert.equal(fs.existsSync('src/components/cleanVisuals.ts'),false);
 const src=fs.readFileSync('src/components/CleanArt.tsx','utf8');assert.ok(!/setInterval|setTimeout|setState|useState/.test(src));
});

test('Clean starts after native layout even if iOS never emits animationLoaded',()=>{
 const f=fixture(),calls=[];let ready=false;
 const native=Object.fromEntries(['play','pause','resume','reset'].map(name=>[name,()=>calls.push(name)]));
 const hidden=f.mountArt({visible:false,onReady:()=>{ready=true;}},native);
 assert.equal(ready,false);assert.ok(!calls.includes('play'));
 assert.equal(typeof hidden.props.onLayout,'function','must have a layout fallback');
 hidden.props.onLayout({nativeEvent:{layout:{width:294.5,height:294.5}}});
 assert.equal(ready,true);
 f.mountArt({visible:ready,onReady:()=>{ready=true;}},native);
 assert.equal(calls.filter(c=>c==='play').length,1);
});
test('zero-size layout does not signal readiness; late load callback does not replay a running bath',()=>{
 const f=fixture(),calls=[];let ready=0;
 const native=Object.fromEntries(['play','pause','resume','reset'].map(name=>[name,()=>calls.push(name)]));
 const first=f.mountArt({visible:false,onReady:()=>ready++},native);
 first.props.onLayout({nativeEvent:{layout:{width:0,height:0}}});assert.equal(ready,0);
 first.props.onLayout({nativeEvent:{layout:{width:294,height:294}}});assert.equal(ready,1);
 const running=f.mountArt({visible:true,onReady:()=>ready++},native);
 running.props.onAnimationLoaded();assert.equal(ready,1);assert.equal(calls.filter(c=>c==='play').length,1);
});

test('late layout after native load failure cannot reopen readiness',()=>{
 const f=fixture();let ready=0,errors=0;
 const native=Object.fromEntries(['play','pause','resume','reset'].map(name=>[name,()=>{}]));
 const art=f.mountArt({visible:false,onReady:()=>ready++,onError:()=>errors++},native);
 art.props.onAnimationFailure('decode failure');assert.equal(errors,1);
 art.props.onLayout({nativeEvent:{layout:{width:294,height:294}}});assert.equal(ready,0);
 art.props.onAnimationLoaded();assert.equal(ready,1);
});

for(const type of ['cat','rabbit'])test(`${type} Clean selects its own artwork, starts from layout, pauses, resumes and completes once`,()=>{
 const f=fixture(),calls=[];let ready=0,finished=0;
 const native=Object.fromEntries(['play','pause','resume','reset'].map(name=>[name,()=>calls.push(name)]));
 const props={type,runId:`${type}-clean-1`,getProgress:()=>1,onReady:()=>ready++,onFinished:()=>finished++};
 const hidden=f.mountArt({...props,visible:false},native);
 assert.ok(hidden.props.source.nm.includes(type));
 assert.deepEqual(Buffer.from(hidden.props.source.assets.find(a=>a.id==='base').p.split(',')[1],'base64'),fs.readFileSync(`assets/pets/${type}.png`));
 hidden.props.onLayout({nativeEvent:{layout:{width:294.5,height:294.5}}});assert.equal(ready,1);
 const running=f.mountArt({...props,visible:true},native);assert.equal(calls.filter(c=>c==='play').length,1);
 f.mountArt({...props,visible:true,paused:true},native);assert.equal(calls.at(-1),'pause');
 f.mountArt({...props,visible:true,paused:false},native);assert.equal(calls.at(-1),'resume');
 running.props.onAnimationFinish(false);running.props.onAnimationFinish(false);assert.equal(finished,1);
});
