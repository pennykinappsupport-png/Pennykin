const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('preloading validates bundled JSON for every species without downloading animation images',()=>{
 const module={exports:{}};
 const src=ts.transpileModule(fs.readFileSync('src/bathSources.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(`(function(require,module,exports){${src}})`)(name=>JSON.parse(fs.readFileSync(name.replace('../',''),'utf8')),module,module.exports);
 for(const type of ['dog','cat','rabbit']){const data=module.exports.preloadBathComposition(type);assert.equal(data.fr,15);assert.equal(data.op,75);}
 module.exports.BATH_SOURCES.dog.fr=30;assert.throws(()=>module.exports.preloadBathComposition('dog'),/15fps/);
});
