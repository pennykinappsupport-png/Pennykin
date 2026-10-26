const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const ts = require('typescript');

// Execute the installed framework's real parser, rather than a reimplementation
// that would accept the decimal percentage which caused the disappearing dog.
const nativePath = path.join(path.dirname(require.resolve('react-native/package.json')), 'Libraries/StyleSheet/processTransformOrigin.js');
const nativeCode = babel.transformSync(fs.readFileSync(nativePath, 'utf8'), {
  configFile: false, babelrc: false,
  plugins: ['@babel/plugin-transform-flow-strip-types', '@babel/plugin-transform-modules-commonjs'],
}).code;
const nativeModule = { exports: {} };
vm.runInThisContext(`(function(require,module,exports,__DEV__){${nativeCode}\n})`, { filename: nativePath })(require, nativeModule, nativeModule.exports, true);
const processOrigin = nativeModule.exports.default;

const layoutPath = path.resolve(__dirname, '../src/sleepArtLayout.ts');
const layoutCode = ts.transpileModule(fs.readFileSync(layoutPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const layoutModule = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${layoutCode}\n})`, { filename: layoutPath })(require, layoutModule, layoutModule.exports);
const { sleepArtStyle } = layoutModule.exports;

test('sleeping dog origin survives the actual native parser at small and large avatar sizes', () => {
  // This is the old failure: its pivot is more than fifty view heights away.
  assert.deepEqual(processOrigin('50% 66.5625%'), ['50%', '5625%', 0]);
  for (const size of [58, 84, 190, 320]) {
    const style = sleepArtStyle('dog', size);
    const origin = processOrigin(style.transformOrigin);
    assert.deepEqual(origin, [size / 2, size * 426 / 640, 0]);
    assert.ok(origin.every(Number.isFinite));
    assert.ok(origin[0] >= 0 && origin[0] <= size && origin[1] >= 0 && origin[1] <= size);
  }
});

test('corrected dog sleep pixels stay inside the room with the cat aspect and floor baseline', () => {
  for (const size of [84, 190, 320]) {
    const style = sleepArtStyle('dog', size);
    const origin = processOrigin(style.transformOrigin);
    const translation = style.transform[0].translateY;
    const scaleY = style.transform[1].scaleY;
    const pixelY = y => (y * size / 640 - origin[1]) * scaleY + origin[1] + translation;
    const top = pixelY(185), bottom = pixelY(426), width = 526 * size / 640;
    assert.ok(top > 0 && bottom < size, 'visible sleeping body must not leave avatar bounds');
    assert.ok(Math.abs(bottom - 585 * size / 640) < 1e-8);
    assert.ok(Math.abs((bottom - top) / width - 303 / 525) < 1e-8);
  }
  assert.deepEqual(sleepArtStyle('cat', 190), {});
  assert.deepEqual(sleepArtStyle('rabbit', 190), {});
});
