const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function financialHookFixture(hookName){
 let slots=[],cursor=0,pending=[],args;
 const queries=[];
 const db={getAllAsync:()=>new Promise((resolve,reject)=>queries.push({resolve,reject}))};
 const react={
  useState(initial){const i=cursor++;slots[i]??={value:typeof initial==='function'?initial():initial};return[slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v;}];},
  useRef(initial){const i=cursor++;return slots[i]??={current:initial};},
  useEffect(fn,deps){const i=cursor++,old=slots[i];if(!old||deps.some((d,j)=>d!==old.deps[j])){pending.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});}},
 };
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('src/useFinancialQueries.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Error,require:name=>name==='react'?react:name==='expo-sqlite'?{useSQLiteContext:()=>db}:require(path.resolve('.test-build/src',name+'.js'))});
 return{queries,render(...next){if(next.length)args=next;cursor=0;const result=module.exports[hookName](...args);for(const effect of pending.splice(0))effect();return result;},flush:()=>new Promise(resolve=>setImmediate(resolve))};
}
module.exports={financialHookFixture};
