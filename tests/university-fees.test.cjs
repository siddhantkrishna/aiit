const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021},fileName:filename}).outputText,
  filename
);
const {feeForUniversity}=require("../src/lib/fees/scope.ts");
test("fee configuration selection is university-specific",()=>{
 const configs=[
   {id:5,universityId:1,originalAmount:4000000},
   {id:9,universityId:2,originalAmount:6500000},
   {id:2,universityId:null,originalAmount:100},
 ];
 assert.equal(feeForUniversity(configs,1)?.id,5);
 assert.equal(feeForUniversity(configs,2)?.id,9);
 assert.equal(feeForUniversity(configs,3),undefined);
 assert.equal(feeForUniversity(configs,null),undefined);
 assert.equal(feeForUniversity(configs,0),undefined);
 assert.equal(feeForUniversity(configs,undefined),undefined);
});
test("latest exact version wins and never substitutes another university",()=>{
 const configs=[
  {id:7,universityId:3,originalAmount:2500000},
  {id:4,universityId:3,originalAmount:2000000},
  {id:9,universityId:1,originalAmount:3000000},
 ];
 assert.equal(feeForUniversity(configs,3)?.id,7);
 assert.equal(feeForUniversity(configs,2),undefined);
});
