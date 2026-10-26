const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
const contact=require('../src/supportContent.json');
const email='pennykinappsupport@gmail.com';
function fixture(){
 let page=null,failLink=false,failCopy=false;const links=[],copies=[],alerts=[];
 const hooks={...React,useState:()=>[page,v=>{page=v;}]};
 const native={View:'View',Pressable:'Pressable',SafeAreaView:'SafeAreaView',ScrollView:'ScrollView',Modal:'Modal',StyleSheet:{create:x=>x},Alert:{alert:(...a)=>alerts.push(a)},Linking:{openURL:async url=>{if(failLink)throw Error('no app');links.push(url);}}};
 const module={exports:{}};
 const resolve=n=>n==='react'?hooks:n==='react-native'?native:n==='expo-clipboard'?{setStringAsync:async v=>{if(failCopy)throw Error('denied');copies.push(v);}}:n==='../display'?{AppText:'Text'}:n==='../theme'?{colors:{},spacing:{}}:n==='./Button'?{Button:'Button'}:n==='../supportContent.json'?contact:n==='../brand'?{APP_VERSION:'1.11.8'}:n==='../support'?{SUPPORT_EMAIL:email,PRIVACY_POLICY_URL:'https://pennykin.app/privacy/',SUPPORT_URL:'https://pennykin.app/support/'}:require(n);
 const code=ts.transpileModule(fs.readFileSync('src/components/PrivacySupportLinks.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:resolve});
 function nodes(x){if(!x||typeof x!=='object')return[];const children=React.Children.toArray(x.props?.children??[]);return[x,...children.flatMap(nodes)];}
 return{links,copies,alerts,render:props=>module.exports.PrivacySupportLinks(props??{}),nodes,find(tree,label){return nodes(tree).find(n=>n.props?.label===label||n.props?.children===label);},failLink:()=>{failLink=true;},failCopy:()=>{failCopy=true;},tick:()=>new Promise(r=>setImmediate(r))};
}
test('offline policy/help text matches canonical Markdown and includes TestFlight and deletion disclosures',()=>{
 for(const[name,file]of[['privacy','PRIVACY_POLICY.md'],['support','SUPPORT.md']]){
  const markdown=fs.readFileSync(file,'utf8').trim().split('\n\n').filter(b=>!b.startsWith('# '));
  const offline=contact[name].flatMap(s=>[...(s.title?['## '+s.title]:[]),...s.paragraphs]);
  assert.deepEqual(offline,markdown);assert.ok(offline.join('\n').includes(email));assert.ok(offline.join('\n').includes('TestFlight'));
 }
});
test('onboarding exposes full offline policy and help without initiating any external action',()=>{
 const f=fixture();let tree=f.render({compact:true});assert.deepEqual(f.links,[]);assert.deepEqual(f.copies,[]);
 f.nodes(tree).find(n=>n.props?.accessibilityHint?.includes('complete policy')).props.onPress();tree=f.render({compact:true});
 assert.equal(f.nodes(tree).find(n=>n.type==='Modal').props.visible,true);assert.ok(f.find(tree,'3. Apple testing and diagnostics'));assert.ok(f.find(tree,'Open online privacy policy'));
 f.nodes(tree).find(n=>n.props?.accessibilityLabel==='Close privacy and support').props.onPress();assert.equal(f.nodes(f.render()).find(n=>n.type==='Modal').props.visible,false);
});
test('online policy, support email composer and copy use the exact chosen destinations',async()=>{
 const f=fixture();let tree=f.render();f.nodes(tree).find(n=>n.props?.accessibilityHint?.includes('complete policy')).props.onPress();tree=f.render();
 f.find(tree,'Open online privacy policy').props.onPress();f.find(tree,'Contact Support').props.onPress();f.find(tree,'Copy support email').props.onPress();await f.tick();
 assert.equal(f.links[0],'https://pennykin.app/privacy/');assert.match(f.links[1],/^mailto:pennykinappsupport@gmail\.com\?subject=/);assert.deepEqual(f.copies,[email]);
});
test('failed browser/email/clipboard actions retain offline content and show fallback instructions',async()=>{
 const f=fixture();f.failLink();f.failCopy();let tree=f.render();f.nodes(tree).find(n=>n.props?.accessibilityHint?.includes('find the support email')).props.onPress();tree=f.render();
 f.find(tree,'Open support website').props.onPress();f.find(tree,'Contact Support').props.onPress();f.find(tree,'Copy support email').props.onPress();await f.tick();
 assert.equal(f.alerts.length,3);assert.ok(f.alerts.some(a=>a[0]==='Could not open email'&&a[1].includes(email)));assert.ok(f.find(f.render(),'How do I delete my data?'));
});
