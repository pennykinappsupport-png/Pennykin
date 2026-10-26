const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs');
const {fixture}=require('./helpers/cleanFixture.cjs');
for(const type of ['cat','rabbit']){
 const data=JSON.parse(fs.readFileSync(`assets/animation/rest-${type}/${type}.json`));
 const alpha=(name,f)=>{const p=data.layers.find(l=>l.nm===name).ks.o;return p.a?p.k.find(k=>k.t===f).s[0]:p.k;};
 test(`${type} Rest embeds only its unchanged original images in the approved five-layer, 15/30/12-frame structure`,()=>{
  assert.ok(data.nm.includes(type));assert.equal(data.fr,15);assert.equal(data.op,57);assert.equal(data.w,1024);assert.equal(data.h,1024);
  assert.deepEqual(data.markers.map(m=>[m.tm,m.dr]),[[0,15],[15,30],[45,12]]);
  for(const name of ['bg_layer','pet_body_layer','pet_face_layer','fx_zzz_layer','ui_prompt_layer'])assert.ok(data.layers.some(l=>l.nm===name));
  const sources={sit:`assets/pets/${type}.png`,blink:`assets/pets/${type}-blink.png`,mouth:`assets/animation/${type}-eat.png`,sleep:`assets/animation/${type}-rest.png`,bed:'assets/items/cozy_cushion.png'};
  assert.equal(data.assets.length,5);for(const asset of data.assets)assert.deepEqual(Buffer.from(asset.p.split(',')[1],'base64'),fs.readFileSync(sources[asset.id]));
 });
 test(`${type} sleep keeps eyes closed, breathes 98–102% from the floor, and restores one awake pose on exit`,()=>{
  for(let f=15;f<=45;f++){
   for(const n of ['Original upright face','Original upright body','Original upright tail','Original yawn mouth'])assert.equal(alpha(n,f),0);
   assert.equal(alpha('Original closed-eye sleep face',f),100);assert.equal(alpha('Original resting torso and tail',f),100);
  }
  assert.equal(alpha('Original closed-eye sleep face',0),0);assert.equal(alpha('Original closed-eye sleep face',56),0);assert.equal(alpha('Original upright face',56),100);
  const torso=data.layers.find(l=>l.nm.startsWith('rest_loop •'));const value=f=>torso.ks.s.k.find(k=>k.t===f).s;
  assert.equal(value(15)[1],102);assert.equal(value(30)[1],98);assert.deepEqual(value(15),value(45));
  const tail=data.layers.find(l=>l.nm==='Original upright tail'),head=data.layers.find(l=>l.nm==='Original upright face');assert.notEqual(tail.parent,head.parent,'tail must follow the body during entry and wake');
 });
 test(`${type} actual native Rest view preloads its own source and selects entry, looping sleep, pause/resume and wake segments`,()=>{
  const f=fixture(),calls=[];const player={play:(a,b)=>calls.push(`play:${a}:${b}`),pause:()=>calls.push('pause'),resume:()=>calls.push('resume'),reset:()=>calls.push('reset')};
  const props={type,runId:`${type}-nap`};let view=f.mountDogRest(props,player);assert.ok(view.props.source.nm.includes(type));assert.equal(view.props.autoPlay,false);assert.equal(view.props.cacheComposition,true);assert.ok(!('progress' in view.props));
  view.props.onLayout({nativeEvent:{layout:{width:294,height:294}}});f.mountDogRest({...props,stage:'Rest_Enter'},player);assert.equal(calls.at(-1),'play:0:15');
  view=f.mountDogRest({...props,stage:'Rest_Loop'},player);assert.equal(view.props.loop,true);assert.equal(calls.at(-1),'play:15:45');
  f.mountDogRest({...props,stage:'Rest_Loop',paused:true},player);assert.equal(calls.at(-1),'pause');
  f.mountDogRest({...props,stage:'Rest_Loop'},player);assert.equal(calls.at(-1),'resume');
  view=f.mountDogRest({...props,stage:'Rest_Exit'},player);assert.equal(view.props.loop,false);assert.equal(calls.at(-1),'play:45:57');
 });
}
