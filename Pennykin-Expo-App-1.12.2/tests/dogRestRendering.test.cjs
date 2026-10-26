const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs');
const {fixture}=require('./helpers/cleanFixture.cjs');
const data=JSON.parse(fs.readFileSync('assets/animation/rest-dog/dog.json'));
function alpha(name,f){const p=data.layers.find(l=>l.nm===name).ks.o;if(!p.a)return p.k;return p.k.find(k=>k.t===f).s[0];}
test('dog Rest retains every original PNG byte and the five independent named layer groups',()=>{
 assert.equal(data.fr,15);assert.equal(data.w,1024);assert.equal(data.h,1024);
 assert.deepEqual(data.markers.map(m=>[m.cm,m.tm,m.dr]),[['Rest_Enter',0,15],['rest_loop',15,30],['Rest_Exit',45,12]]);
 for(const name of ['bg_layer','pet_body_layer','pet_face_layer','fx_zzz_layer','ui_prompt_layer'])assert.ok(data.layers.some(l=>l.nm===name));
 const sources={sit:'assets/pets/dog.png',blink:'assets/pets/dog-blink.png',mouth:'assets/animation/dog-eat.png',sleep:'assets/animation/dog-rest.png',bed:'assets/items/cozy_cushion.png'};
 for(const asset of data.assets)assert.deepEqual(Buffer.from(asset.p.split(',')[1],'base64'),fs.readFileSync(sources[asset.id]));
});
test('sleep loop has only the closed sleeping head and torso; upright/awake artwork stays at zero opacity',()=>{
 for(let f=15;f<=45;f++){
  assert.equal(alpha('Original upright face',f),0);assert.equal(alpha('Original upright body',f),0);assert.equal(alpha('Original yawn mouth',f),0);
  assert.equal(alpha('Original closed-eye sleep face',f),100);assert.equal(alpha('Original resting torso and tail',f),100);
 }
 assert.equal(alpha('Original closed-eye sleep face',0),0);assert.equal(alpha('Original resting torso and tail',0),0);
 assert.equal(alpha('Original closed-eye sleep face',56),0);assert.equal(alpha('Original upright face',56),100);
 const chest=data.layers.find(l=>l.nm.startsWith('rest_loop •'));
 const scale=f=>chest.ks.s.k.find(k=>k.t===f).s;
 assert.equal(scale(15)[1],102);assert.equal(scale(30)[1],98);assert.deepEqual(scale(15),scale(45));
});
test('actual DogRest JSX preloads one native composition, uses layout fallback and selects a looping 30-frame segment',()=>{
 const f=fixture(),calls=[];
 const native={play:(a,b)=>calls.push(`play:${a}:${b}`),pause:()=>calls.push('pause'),resume:()=>calls.push('resume'),reset:()=>calls.push('reset')};
 const preloaded=f.mountDogRest({},native);assert.equal(preloaded.props.autoPlay,false);assert.equal(preloaded.props.cacheComposition,true);assert.ok(!Object.hasOwn(preloaded.props,'progress'));
 preloaded.props.onLayout({nativeEvent:{layout:{width:294,height:294}}});
 let view=f.mountDogRest({stage:'Rest_Enter'},native);assert.equal(calls.at(-1),'play:0:15');assert.equal(view.props.loop,false);
 view=f.mountDogRest({stage:'Rest_Loop'},native);assert.equal(calls.at(-1),'play:15:45');assert.equal(view.props.loop,true);
 view=f.mountDogRest({stage:'Rest_Exit'},native);assert.equal(calls.at(-1),'play:45:57');assert.equal(view.props.loop,false);
});
test('a preload failure is reported on entering Rest instead of waiting silently forever',()=>{
 const f=fixture(),calls=[];const native={play(){},pause(){},resume(){},reset(){}};
 const hidden=f.mountDogRest({onError:id=>calls.push(id)},native);hidden.props.onAnimationFailure();
 f.mountDogRest({stage:'Rest_Enter',onError:id=>calls.push(id)},native);assert.deepEqual(calls,['dog-nap']);
});
