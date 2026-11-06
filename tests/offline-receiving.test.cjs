const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module,filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},fileName:filename}).outputText,filename);
const {validateOfflineInput}=require("../src/lib/fees/offline-rules.ts");
const base={
  requestKey:"99435551-18e2-4f1a-bd38-d16900825eb6",
  studentId:123,receiverStaffId:12,payerName:"A Parent",payerMobile:"9876543210",
  payerEmail:"parent@example.com",payerRelation:"FATHER",
  purposeType:"TUITION",purposeName:"Semester 1 Fee",obligationId:3,
  amount:"1500.50",paymentMethod:"CASH",notes:"Received against official cash voucher",
  physicallyReceived:true,notifyContacts:true,
};
test("offline receiving converts INR to integer paise and normalizes contact details",()=>{
  const r=validateOfflineInput({...base,payerMobile:"+91 98765 43210",payerEmail:" PARENT@EXAMPLE.COM "});
  assert.equal(r.amountPaise,150050);assert.equal(r.payerMobile,"919876543210".slice(-10));assert.equal(r.payerEmail,"parent@example.com");
  assert.equal(r.applicationId,undefined);assert.equal(r.studentId,123);
});
test("only one student or admission target is allowed",()=>{
  assert.throws(()=>validateOfflineInput({...base,applicationId:8}),/exactly one/i);
  assert.throws(()=>validateOfflineInput({...base,studentId:undefined}),/exactly one/i);
});
test("no recording without actual money received and notice consent",()=>{
  assert.throws(()=>validateOfflineInput({...base,physicallyReceived:false}),/actually received/i);
  assert.throws(()=>validateOfflineInput({...base,notifyContacts:false}),/notifications/i);
});
test("rejects incorrect amounts, mobile numbers and invalid references",()=>{
  assert.throws(()=>validateOfflineInput({...base,amount:"1.234"}),/fee/i);
  assert.throws(()=>validateOfflineInput({...base,payerMobile:"11111"}),/mobile/i);
  assert.throws(()=>validateOfflineInput({...base,paymentMethod:"UPI",paymentReference:""}),/transaction reference/i);
  assert.throws(()=>validateOfflineInput({...base,requestKey:"insecure"}),/submission token/i);
});
test("tuition requires a fee obligation and service receipts are independent",()=>{
  assert.throws(()=>validateOfflineInput({...base,obligationId:undefined}),/installment/i);
  const service=validateOfflineInput({...base,purposeType:"SERVICE",obligationId:undefined,purposeName:"Certificate service"});
  assert.equal(service.purposeType,"SERVICE");assert.equal(service.obligationId,undefined);
});
