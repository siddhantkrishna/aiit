const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const original = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...rest) {
  return original.call(this, name.startsWith('@/') ? path.join(process.cwd(), 'src', name.slice(2)) : name, parent, ...rest);
};
require.extensions['.ts'] = function (module, filename) {
  module._compile(ts.transpileModule(require('node:fs').readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename);
};
