// Render the actual bundled Lottie JSON, offline, using lottie-web + Chromium.
const fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
// Extract without restoring archive ownership. Some managed environments do
// not allow tar-fs to chown files in /tmp. This uses only bundled npm bytes.
function bundledExecutable(){
 const os=require('os'),z=require('zlib'),cp=require('child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pennykin-bath-preview-'));
 const bin=path.join(path.dirname(require.resolve('@sparticuz/chromium')),'../bin');
 for(const file of ['chromium.br','fonts.tar.br','swiftshader.tar.br']){
  const data=z.brotliDecompressSync(fs.readFileSync(path.join(bin,file)));
  if(file==='chromium.br')fs.writeFileSync(path.join(dir,'chromium'),data,{mode:0o700});
  else {const result=cp.spawnSync('tar',['--no-same-owner','-xf','-','-C',dir],{input:data});if(result.status)throw Error(result.stderr.toString());}
 }
 process.env.FONTCONFIG_PATH=path.join(dir,'fonts');
 process.env.LD_LIBRARY_PATH=dir+(process.env.LD_LIBRARY_PATH?':'+process.env.LD_LIBRARY_PATH:'');
 return path.join(dir,'chromium');
} 
(async()=>{
 const root=path.resolve(__dirname,'..'),dest=path.join(root,'docs/bath-v4');fs.mkdirSync(dest,{recursive:true});
 const packaged=require('@sparticuz/chromium');const bundled=packaged.default??packaged;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BATH_CHROMIUM_PATH??bundledExecutable(),args:bundled.args});
 const page=await browser.newPage({viewport:{width:640,height:700},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function freshScene(){
 await page.goto('about:blank');
 await page.setContent('<html><body style="margin:0;background:#F7F2E9"><div id="scene" style="width:640px;height:640px"></div><div id="label" style="font:16px sans-serif;text-align:center;color:#685348"></div></body></html>');
 await page.addScriptTag({path:require.resolve('lottie-web/build/player/lottie.min.js')});
 }
 async function load(species){
  const data=JSON.parse(fs.readFileSync(path.join(root,`assets/animation/bath-original/${species}.json`)));
  await page.evaluate(data=>new Promise((resolve,reject)=>{
   window.movie?.destroy();window.movie=lottie.loadAnimation({container:document.getElementById('scene'),renderer:'svg',loop:false,autoplay:false,animationData:data});
   movie.setSubframe(false);if(movie.isLoaded)resolve();else movie.addEventListener('DOMLoaded',()=>resolve());movie.addEventListener('data_failed',()=>reject(Error('Lottie data failed')));
  }),data);
 }
 let sceneBytes=0;
 for(const species of (process.env.BATH_PREVIEW_SPECIES??'dog,cat,rabbit').split(',')){
  await freshScene();await load(species);
  fs.mkdirSync(path.join(dest,species),{recursive:true});
  const frames=Array.from({length:75},(_,i)=>i);
  for(const f of frames){
   await page.evaluate(f=>{movie.goToAndStop(f,true);document.getElementById('label').textContent=`Frame ${f+1} / 75  •  ${(f/15).toFixed(2)} s`;},f);
   await page.screenshot({path:path.join(dest,species,`${String(f).padStart(2,'0')}.png`)});
  }
  sceneBytes+=(await page.locator('#scene').innerHTML()).length;
  console.log(species,'rendered',frames.length,'frames');
 }
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(dest,'renderer-check.txt'),'Lottie SVG render: PASS\nNo browser errors.\n'+sceneBytes+' bytes in rendered scenes\n');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
