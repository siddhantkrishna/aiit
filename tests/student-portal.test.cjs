const test=require("node:test");const assert=require("node:assert/strict");
const fs=require("node:fs"),ts=require("typescript"),Module=require("node:module");
const originalLoad=Module._load;
Module._load=function(name,parent,...args){
 if(name==="next/server")return {NextResponse:{json:(body,init={})=>({body,status:init.status||200})}};
 if(name==="@/lib/student-auth")return {getStudentFromRequest:req=>req.mockStudentId||null};
 return originalLoad.call(this,name,parent,...args);
};
require.extensions[".ts"]=(module,filename)=>module._compile(ts.transpileModule(
 fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}
).outputText,filename);
const {studentSessionId,validDay,safeStatus,secureSameOrigin,SERVICE_TYPES}=require("../src/lib/student-portal.ts");
Module._load=originalLoad;
test("valid student sessions require numeric positive IDs",()=>{
 assert.equal(studentSessionId({mockStudentId:"123"}),123);
 for(const id of ["",null,"not-a-number","-1","0","1.5","90071992547409990"]){
   assert.equal(studentSessionId({mockStudentId:id}),null);
 }
});
test("attendance dates and statuses are strictly validated",()=>{
 assert.equal(validDay("2026-11-06"),true);
 assert.equal(validDay("2026-02-30"),false);
 assert.equal(validDay("2024-02-29"),true);
 assert.equal(validDay("2026/11/06"),false);
 for(const status of ["PRESENT","ABSENT","LATE","EXCUSED"])assert.equal(safeStatus(status),true);
 assert.equal(safeStatus("overdue"),false);
 assert.equal(safeStatus("PRESENT;delete"),false);
});
test("cross-origin form submissions are rejected",()=>{
 const req=(origin)=>({headers:{get:()=>origin},nextUrl:{origin:"https://www.aiitcollege.in"}});
 assert.equal(secureSameOrigin(req("https://www.aiitcollege.in")),true);
 assert.equal(secureSameOrigin(req("https://malicious.example")),false);
 assert.equal(secureSameOrigin(req(null)),true);
});
test("student service types are allowlisted",()=>{
 assert.ok(SERVICE_TYPES.includes("Document Verification"));
 assert.equal(SERVICE_TYPES.includes("Set tuition to zero"),false);
});
