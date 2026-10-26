// Render the actual bundled Lottie JSON, offline, using lottie-web + Chromium.
const fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
// Extract without restoring archive ownership. Some managed environments do
// not allow tar-fs to chown files in /tmp. This uses only bundled npm bytes.
function bundledExecutable(){
 const os=require('os'),z=require('zlib'),cp=require('child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pennykin-rest-preview-'));
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
 const species=process.argv[2];if(!['cat','rabbit'].includes(species))throw Error('Specify cat or rabbit');
 const root=path.resolve(__dirname,'..'),dest=path.join(root,`docs/rest-${species}/frames`);fs.mkdirSync(dest,{recursive:true});
 const packaged=require('@sparticuz/chromium');const bundled=packaged.default??packaged;
 const browser=await chromium.launch({headless:true,executablePath:process.env.REST_CHROMIUM_PATH??bundledExecutable(),args:bundled.args});
 const page=await browser.newPage({viewport:{width:640,height:700},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<body style="margin:0;background:#F7F2E9"><div id="scene" style="width:640px;height:640px"></div><div id="label" style="font:16px sans-serif;text-align:center;color:#685348"></div>');
 await page.addScriptTag({path:require.resolve('lottie-web/build/player/lottie.min.js')});
 const data=JSON.parse(fs.readFileSync(path.join(root,`assets/animation/rest-${species}/${species}.json`)));
 await page.evaluate(data=>new Promise((resolve,reject)=>{window.movie=lottie.loadAnimation({container:document.getElementById('scene'),renderer:'svg',loop:false,autoplay:false,animationData:data});movie.setSubframe(false);movie.addEventListener('DOMLoaded',resolve);movie.addEventListener('data_failed',()=>reject(Error('Lottie data failed')))}),data);
 for(let f=0;f<57;f++){
  await page.evaluate(f=>{movie.goToAndStop(f,true);document.getElementById('label').textContent=f<15?`ENTRY • ${f+1} / 15` : f<45?`SLEEP LOOP • ${f-14} / 30` : `WAKE-UP • ${f-44} / 12`;},f);
  await page.screenshot({path:path.join(dest,`${String(f).padStart(2,'0')}.png`)});
 }
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(root,`docs/rest-${species}/renderer-check.txt`),'PASS: Actual native-bundled JSON rendered all 57 authored frames in Lottie Web. No browser errors.\n');
 await browser.close();console.log(species,'Rest rendered: 15 entry + 30 loop + 12 wake frames');
})().catch(e=>{console.error(e);process.exit(1)});
