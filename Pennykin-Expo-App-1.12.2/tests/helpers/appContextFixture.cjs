const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
const dates=require('../../.test-build/src/date.js');
const database=require('../../.test-build/src/database.js');
function appContextFixture(db,initialNow){
 let clock=initialNow,cursor=0,slots=[];
 class ClockDate extends Date {constructor(...args){super(...(args.length?args:[clock.getTime()]));}static now(){return clock.getTime();}}
 const hooks={...React,
  useState(initial){const i=cursor++;slots[i]??={value:typeof initial==='function'?initial():initial};return[slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v}];},
  useRef(initial){const i=cursor++;return slots[i]??={current:initial};},
  useCallback(fn){return fn;},useMemo(fn){return fn();},useEffect(){},
 };
 const file=path.resolve('src/AppContext.tsx'),module={exports:{}};
 const resolve=name=>{
  if(name==='react')return hooks;if(name==='expo-sqlite')return{useSQLiteContext:()=>db};
  if(name==='./date')return{...dates,todayKey:(d=clock)=>dates.todayKey(d),weekStartKey:(d=clock)=>dates.weekStartKey(d)};
  if(name==='./database')return{...database,loadSnapshot:d=>database.loadSnapshot(d,clock)};
  return require(path.resolve('.test-build/src',name+'.js'));
 };
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:resolve,Date:ClockDate,console});
 return{render(){cursor=0;return module.exports.AppProvider({children:null}).props.value;},setNow(now){clock=now;}};
}
module.exports={appContextFixture};
