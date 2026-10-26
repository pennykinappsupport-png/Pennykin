const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

// Execute the production hook and JSX with a deterministic native-animation
// adapter. This checks the opacity values bound to rendered views, rather
// than a second mathematical description of the intended animation.
function fixture() {
  let now = 0;
  const jobs = [];
  const calls = [];
  class Value {
    constructor(value) { this.value = value; this.listeners = new Map(); }
    setValue(value) { this.value = value; for (const fn of this.listeners.values()) fn({ value }); }
    stopAnimation(fn) { fn?.(this.value); }
    addListener(fn) { const id = String(this.listeners.size); this.listeners.set(id, fn); return id; }
    removeListener(id) { this.listeners.delete(id); }
    interpolate(config) { return { value: this, config }; }
  }
  function duration(plan) {
    if (plan.kind === 'sequence') return plan.children.reduce((sum, child) => sum + duration(child), 0);
    if (plan.kind === 'parallel') return Math.max(0, ...plan.children.map(duration));
    return plan.duration;
  }
  function flattenPlan(plan, start, segments) {
    if (plan.kind === 'sequence' || plan.kind === 'parallel') {
      let cursor = start;
      for (const child of plan.children) {
        flattenPlan(child, plan.kind === 'sequence' ? cursor : start, segments);
        cursor += duration(child);
      }
    } else if (plan.kind !== 'delay') segments.push({ ...plan, start });
  }
  function animation(plan) {
    return { ...plan, start(callback) {
      const segments = [];
      flattenPlan(plan, now, segments);
      const job = { active: true, segments, end: now + duration(plan), callback };
      jobs.push(job); this.job = job;
    }, stop() { if (this.job) this.job.active = false; } };
  }
  const Animated = {
    Value, View: 'Animated.View', Image: 'Animated.Image',
    delay: (duration) => animation({ kind: 'delay', duration }),
    timing: (value, config) => {
      calls.push({ kind: 'timing', value, ...config });
      return animation({ kind: 'timing', value, duration: config.duration, to: config.toValue, easing: config.easing });
    },
    spring: (value, config) => {
      calls.push({ kind: 'spring', value, ...config });
      return animation({ kind: 'spring', value, duration: 550, to: config.toValue });
    },
    sequence: (children) => animation({ kind: 'sequence', children }),
    parallel: (children) => animation({ kind: 'parallel', children }),
  };
  const ease = (t) => t * t * (3 - 2 * t);
  const Easing = { linear: (t) => t, ease, inOut: (fn) => fn };
  let slots = [], cursor = 0, pending = [], dirty = false, stateWrites = 0;
  const hooks = {
    ...React,
    useMemo(fn, deps) { const i = cursor++; const old = slots[i]; if (!old || deps.some((d,j)=>d!==old.deps[j])) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) {
      const index = cursor++;
      const slot = slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slot.value, (next) => { stateWrites++; slot.value = typeof next === 'function' ? next(slot.value) : next; dirty = true; }];
    },
    useEffect(fn, deps) { effect(fn, deps, false); },
    useLayoutEffect(fn, deps) { effect(fn, deps, true); },
  };
  function effect(fn, deps, layout) {
    const index = cursor++;
    const previous = slots[index];
    if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
      pending.push({ index, fn, deps, layout, cleanup: previous?.cleanup });
    }
  }
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    }, fileName: filename }).outputText;
    const resolve = (name) => {
      if (name === 'react') return hooks;
      if (name === './BathSound') return {BathSound:'BathSound'};
      if (name === 'lottie-react-native')return {__esModule:true,default:'LottieView'};
      if (name.endsWith('.json'))return JSON.parse(fs.readFileSync(path.resolve(path.dirname(filename),name),'utf8'));
      if (name === 'react-native') return { Animated, Easing, Image: 'Image', View: 'View', StyleSheet: { create: (styles) => styles } };
      if (name === 'react-native-svg') return { __esModule: true, default: 'Svg', ClipPath: 'ClipPath', Defs: 'Defs', Image: 'SvgImage', Rect: 'Rect' };
      if (name.endsWith('.png')) return path.resolve(path.dirname(filename),name);
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(filename), name);
        return load(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx');
      }
      return require(name);
    };
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(resolve, module, module.exports);
    return module.exports;
  }
  const { useCleanMotion } = load(path.resolve(__dirname, '../../src/components/useCleanMotion.ts'));
  const { CleanArt } = load(path.resolve(__dirname, '../../src/components/CleanArt.tsx'));
  const progress = new Value(0), messages = [], completed = [];
  let args = [true, 'clean-1', false, progress, (id, message) => messages.push({id, message}), (id) => completed.push(id)];
  function render() {
    let result, count = 0;
    do {
      cursor = 0; pending = []; dirty = false;
      result = useCleanMotion(...args);
      pending.sort((a, b) => Number(b.layout) - Number(a.layout)).forEach(({ index, fn, deps, cleanup }) => {
        cleanup?.(); slots[index] = { deps, cleanup: fn() };
      });
      assert.ok(count++ < 10, 'hook should settle');
    } while (dirty);
    return result;
  }
  render();
  function advance(ms) {
    now = ms;
    for (const job of jobs) {
      if (!job.active) continue;
      for (const segment of job.segments) {
        if (ms < segment.start) continue;
        segment.from ??= segment.value.value;
        const t = Math.min(1, (ms - segment.start) / segment.duration);
        const mix = segment.easing ? segment.easing(t) : t;
        segment.value.setValue(segment.from + (segment.to - segment.from) * mix);
      }
      if (ms >= job.end) { job.active = false; job.callback?.({ finished: true }); }
    }
    render();
  }
  return { progress, calls, messages, completed, advance, get stateWrites(){return stateWrites;},
    renderArt(props) { cursor = 100; return CleanArt({ type:'dog',size:190,visible:true,runId:'clean-1',getProgress:()=>progress.value,onReady(){},onError(){},onFinished(){},...props }); },
    mountArt(props,native){
      cursor=100;pending=[];
      const tree=CleanArt({type:'dog',size:190,visible:true,runId:'clean-1',getProgress:()=>progress.value,onReady(){},onError(){},onFinished(){},...props});
      const view=flatten(tree).find(n=>n.type==='LottieView');view.props.ref.current=native;
      pending.sort((a,b)=>Number(b.layout)-Number(a.layout)).forEach(({index,fn,deps,cleanup})=>{cleanup?.();slots[index]={deps,cleanup:fn()};});
      return view;
    },
    mountDogRest(props,native){
      cursor=200;pending=[];
      const DogRestArt=load(path.resolve(__dirname,'../../src/components/DogRestArt.tsx')).DogRestArt;
      const tree=DogRestArt({size:190,stage:null,paused:false,runId:'dog-nap',...props});
      const view=flatten(tree).find(n=>n.type==='LottieView');view.props.ref.current=native;
      pending.sort((a,b)=>Number(b.layout)-Number(a.layout)).forEach(({index,fn,deps,cleanup})=>{cleanup?.();slots[index]={deps,cleanup:fn()};});
      return view;
    },
    nativeFinish(){const result=render();result.finish();return render();},
    load,
    update(active, paused = false, id = 'clean-1') { args = [active, id, paused, progress, args[4], args[5]]; return render(); } };
}

function flatten(node, result = []) {
  if (!node || typeof node !== 'object') return result;
  result.push(node);
  React.Children.forEach(node.props?.children, child => flatten(child, result));
  return result;
}
function styleOf(node) { return Object.assign({}, ...[node.props.style].flat(Infinity)); }
function valueOf(interpolation) {
  if (!interpolation?.config) return interpolation;
  const { inputRange: input, outputRange: output } = interpolation.config;
  const p = interpolation.value.value;
  let i=0; while (i<input.length-2 && p>input[i+1])i++;
  const t=Math.max(0,Math.min(1,(p-input[i])/(input[i+1]-input[i])));
  if(typeof output[i]==='string')return (parseFloat(output[i])+(parseFloat(output[i+1])-parseFloat(output[i]))*t)+'deg';
  return output[i]+(output[i+1]-output[i])*t;
}
function resolveStyle(style) {
  const merged=Object.assign({},...[style].flat(Infinity));
  return Object.fromEntries(Object.entries(merged).map(([key,v])=>[key,key==='transform' ? v.map(item=>Object.fromEntries(Object.entries(item).map(([k,n])=>[k,valueOf(n)]))) : valueOf(v)]));
}
module.exports={fixture,flatten,styleOf,valueOf,resolveStyle};
