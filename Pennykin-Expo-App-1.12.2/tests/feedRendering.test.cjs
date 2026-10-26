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
  }
  function duration(plan) {
    if (plan.kind === 'sequence') return plan.children.reduce((sum, child) => sum + duration(child), 0);
    if (plan.kind === 'parallel') return Math.max(0, ...plan.children.map(duration));
    return plan.duration;
  }
  function flatten(plan, start, segments) {
    if (plan.kind === 'sequence' || plan.kind === 'parallel') {
      let cursor = start;
      for (const child of plan.children) {
        flatten(child, plan.kind === 'sequence' ? cursor : start, segments);
        cursor += duration(child);
      }
    } else if (plan.kind !== 'delay') segments.push({ ...plan, start });
  }
  function animation(plan) {
    return { ...plan, start(callback) {
      const segments = [];
      flatten(plan, now, segments);
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
  let slots = [], cursor = 0, pending = [], dirty = false;
  const hooks = {
    ...React,
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) {
      const index = cursor++;
      const slot = slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slot.value, (next) => { slot.value = typeof next === 'function' ? next(slot.value) : next; dirty = true; }];
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
      if (name === 'react-native') return { Animated, Easing, StyleSheet: { create: (styles) => styles } };
      if (name === 'react-native-svg') return { __esModule: true, default: 'Svg', ClipPath: 'ClipPath', Defs: 'Defs', Image: 'SvgImage', Rect: 'Rect' };
      if (name.endsWith('/petImages')) return {
        PET_IMAGES: { dog: 'dog-idle', rabbit: 'rabbit-idle', cat: 'cat-idle' },
        PET_CARE_POSES: { dog: ['dog-receive', 'dog-eat', 'dog-satisfied', 'dog-wipe', 'dog-lick'], rabbit: ['rabbit-receive', 'rabbit-eat', 'rabbit-satisfied', 'rabbit-wipe', 'rabbit-lick'] },
        CAT_CARE_ATLAS: 'cat-atlas', CAT_LICK_IMAGE: 'cat-lick',
      };
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(filename), name);
        return load(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx');
      }
      return require(name);
    };
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(resolve, module, module.exports);
    return module.exports;
  }
  const { useFeedMotion, createFeedVisuals } = load(path.resolve(__dirname, '../src/components/useFeedMotion.ts'));
  const { FeedArt } = load(path.resolve(__dirname, '../src/components/FeedArt.tsx'));
  const progress = new Value(0), visuals = createFeedVisuals(), finished = [];
  let args = [true, 'feed-1', false, progress, visuals, (id) => finished.push(id)];
  function render() {
    let result, count = 0;
    do {
      cursor = 0; pending = []; dirty = false;
      result = useFeedMotion(...args);
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
  function art(type) {
    return FeedArt({ type, size: 190, visuals, onLayerLoad: () => {} });
  }
  function nodes(tree) { return React.Children.toArray(tree.props.children); }
  return { visuals, progress, calls, finished, advance, art, nodes,
    update(active, paused = false, id = 'feed-1') { args = [active, id, paused, progress, visuals, args[5]]; return render(); } };
}

test('production Feed views bind native opacity values and retain both images for 300ms', () => {
  for (const type of ['dog', 'rabbit', 'cat']) {
    const f = fixture();
    const tree = f.art(type);
    assert.equal(tree.props.style[1].opacity, f.visuals.visibility);
    const layers = f.nodes(tree);
    assert.equal(layers.length, 5);
    layers.forEach((layer, index) => assert.equal(layer.props.style[1].opacity, f.visuals.layers[index]));
    const keys = layers.map((layer) => layer.key);
    f.advance(350);
    assert.equal(f.visuals.layers[0].value, 1);
    f.advance(500);
    assert.equal(f.visuals.layers[0].value, 0.5);
    assert.equal(f.visuals.layers[1].value, 0.5);
    assert.deepEqual(f.nodes(f.art(type)).map((layer) => layer.key), keys);
    f.advance(649);
    assert.ok(f.visuals.layers[0].value > 0 && f.visuals.layers[1].value < 1);
    f.advance(650);
    assert.equal(f.visuals.layers[0].value, 0);
    assert.equal(f.visuals.layers[1].value, 1);
    const fades = f.calls.filter((call) => f.visuals.layers.includes(call.value));
    assert.equal(fades.length, 10);
    assert.ok(fades.every((call) => call.duration === 300 && call.useNativeDriver));
  }
});

test('actual bubble starts 100ms after posture, and pickup uses a native spring', () => {
  const f = fixture();
  f.advance(350); f.advance(400);
  assert.ok(f.visuals.layers[1].value > 0);
  assert.equal(f.visuals.speechOpacity.value, 0);
  f.advance(450);
  assert.equal(f.visuals.speechOpacity.value, 0);
  f.advance(510);
  assert.equal(f.visuals.speechOpacity.value, 0.5);
  assert.ok(f.calls.some((call) => call.value === f.visuals.pickupScale && call.toValue === 1.05));
  assert.ok(f.calls.some((call) => call.kind === 'spring' && call.value === f.visuals.pickupScale && call.toValue === 1 && call.useNativeDriver));
});

test('Feed finishes only after the full final crossfade; interruption retains outgoing views', () => {
  const f = fixture();
  for (const ms of [350, 650, 800, 1100, 1150, 1450, 1750, 1900, 2050]) f.advance(ms);
  assert.deepEqual(f.finished, []);
  assert.equal(f.visuals.layers[0].value, 0.5);
  assert.equal(f.visuals.layers[4].value, 0.5);
  f.advance(2200);
  assert.deepEqual(f.finished, ['feed-1']);
  assert.equal(f.visuals.layers[0].value, 1);
  assert.equal(f.visuals.layers[4].value, 0);

  const interrupted = fixture();
  interrupted.advance(350); interrupted.advance(500);
  interrupted.update(false);
  assert.equal(interrupted.visuals.visibility.value, 1);
  interrupted.advance(650);
  assert.equal(interrupted.visuals.visibility.value, 0.5);
  assert.equal(interrupted.nodes(interrupted.art('dog')).length, 5);
  interrupted.advance(800);
  assert.equal(interrupted.visuals.visibility.value, 0);
  assert.deepEqual(interrupted.finished, []);
});

test('pausing mid-crossfade freezes the mounted layer opacities and resumes the remainder', () => {
  const f = fixture();
  f.advance(350); f.advance(500);
  f.update(true, true);
  f.advance(1000);
  assert.equal(f.visuals.layers[0].value, 0.5);
  assert.equal(f.visuals.layers[1].value, 0.5);
  f.update(true, false);
  assert.equal(f.visuals.layers[1].value, 0.5);
  f.advance(1150);
  assert.equal(f.visuals.layers[0].value, 0);
  assert.equal(f.visuals.layers[1].value, 1);
  assert.deepEqual(f.finished, []);
});
