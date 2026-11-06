const test = require("node:test"); const assert=require("node:assert/strict");
const fs=require("node:fs"),ts=require("typescript");
require.extensions[".ts"]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {normalizeIndianMobile,validDateOfBirth,phoneCandidates,exactlyOneMatch}=require("../src/lib/student-login.ts");
test("Mobile login accepts a valid registered Indian number with or without country code",()=>{
 assert.equal(normalizeIndianMobile("9876543210"),"9876543210");
 assert.equal(normalizeIndianMobile("+91 98765 43210"),"9876543210");
 assert.equal(normalizeIndianMobile("919876543210"),"9876543210");
 assert.deepEqual(phoneCandidates("9876543210"),["9876543210","919876543210","+919876543210"]);
});
test("Reject invalid phones, malformed birthdays and future dates",()=>{
 for(const value of ["", "1234567890", "98765", "98 76 test 3210", "002919876543210", null, "98765432101"])assert.equal(normalizeIndianMobile(value),null);
 for(const value of ["2026-02-30","2005/08/08","2100-01-01","",null])assert.equal(validDateOfBirth(value),false);
 assert.equal(validDateOfBirth("2008-08-08"),true);
});
test("Ambiguous or missing student matches never authenticate",()=>{
 assert.equal(exactlyOneMatch(0),false);
 assert.equal(exactlyOneMatch(1),true);
 assert.equal(exactlyOneMatch(2),false);
});
