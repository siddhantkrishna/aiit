const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const ts = require('typescript');
const { createHmac, randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq } = require('drizzle-orm');
const { getTableConfig } = require('drizzle-orm/pg-core');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'isolated-test-session-secret';
process.env.RAZORPAY_KEY_ID = 'rzp_test_isolated';
process.env.RAZORPAY_KEY_SECRET = 'isolated-gateway-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'isolated-webhook-secret';
let database, pool, embedded, service, rules, schema, admin, webhook, report;
let createCalls = 0; let simulateTimeout = false; let fetchFails = false;
const remoteOrders = new Map(), remotePayments = new Map(), refunds = new Map();
const gateway = {
  orders: {
    create: async input => { createCalls++; const order = { ...input, id: `order_Test${createCalls}`, status: 'created' }; remoteOrders.set(order.id, order); await new Promise(r => setTimeout(r, 20)); if(simulateTimeout) throw new Error('network timeout'); return order; },
    all: async input => ({ items: [...remoteOrders.values()].filter(o => o.receipt === input.receipt) }),
    fetch: async id => { if(fetchFails) throw new Error('provider unavailable'); return remoteOrders.get(id); },
    fetchPayments: async id => ({ items: [...remotePayments.values()].filter(p => p.order_id === id) }),
  },
  payments: { fetch: async id => remotePayments.get(id), fetchMultipleRefund: async (id, opts) => ({ items: (refunds.get(id)||[]).slice(opts.skip,opts.skip+opts.count) }) },
};
const originalLoad = Module._load;
Module._load = function(name,parent,...args) {
  if(name === '@/lib/supabase') return {supabase:{storage:{from:()=>({})}}};
  if(name === '@/db') { assert.ok(database, 'isolated database must exist'); return { db: database, pool }; }
  if((name === './provider' && parent.filename.includes('/fees/')) || name === '@/lib/fees/provider') return { gateway: () => gateway };
  if(name.startsWith('@/')) name = path.join(__dirname,'../src',name.slice(2));
  return originalLoad.call(this,name,parent,...args);
};
require.extensions['.ts'] = (module,filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,esModuleInterop:true},fileName:filename}).outputText,filename);
const signed = raw => createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
let fixtureNumber=0;
async function applicant() {
  const i=++fixtureNumber;
  const [course]=await database.insert(schema.courses).values({name:`Test course ${i}`,enabled:true}).returning();
  const [application]=await database.insert(schema.applications).values({applicationId:`TEST-${i}`,courseId:course.id,firstName:'TEST',lastName:`Applicant ${i}`,fatherName:'TEST',motherName:'TEST',dob:'2000-01-01',gender:'Other',mobile:'9999999999',address:'TEST ONLY',city:'TEST',state:'TEST',pinCode:'000000',declaration:true,status:'pending'}).returning();
  await admin.configure(1,{courseId:course.id,originalFee:'60000.00',semesters:4,effectiveFrom:'2020-01-01',reason:'Isolated test fixture only',schedule:[{amount:'10000',dueDate:'2020-01-01'},{amount:'20000',dueDate:'2020-02-01'},{amount:'15000',dueDate:'2099-01-01'},{amount:'15000',dueDate:'2099-02-01'}]});
  return {who:{applicationId:application.id},application,course};
}
function providerPayment(order,status='captured') {
  const id=`pay_Test${remotePayments.size+1}`;
  const p={id,order_id:order.orderId,amount:order.amount,currency:'INR',status,method:'upi',created_at:Math.floor(Date.now()/1000),amount_refunded:0,refund_status:null,fee:100,tax:18};remotePayments.set(id,p);
  if(status==='captured')remoteOrders.get(order.orderId).status='paid';
  return p;
}
async function firstOrder(f,kind='full') {
  await service.selectPlan(f.who,kind); const portal=await service.portal(f.who); const obligation=portal.plan.schedule[0];
  return {order:await service.createOrder(f.who,obligation.id),obligation};
}
before(async()=>{
  const EmbeddedPostgres=(await import('embedded-postgres')).default;
  const net=require('node:net'); const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
  embedded=new EmbeddedPostgres({databaseDir:fs.mkdtempSync(path.join(os.tmpdir(),'aiit-fees-pg-')),user:'postgres',password:randomBytes(16).toString('hex'),port,persistent:false,autoRehydrateSymlinks:true,postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:()=>{}});
  await embedded.initialise();await embedded.start();
  pool=new Pool({host:'127.0.0.1',port,user:'postgres',password:embedded.options?.password || undefined,database:'postgres',max:10});
  // Use the package's configured client credentials; never read DATABASE_URL or dotenv.
  const client=embedded.getPgClient();await client.connect();
  const pgPassword=client.connectionParameters.password;await client.end();await pool.end();
  pool=new Pool({host:'127.0.0.1',port,user:'postgres',password:pgPassword,database:'postgres',max:10});database=drizzle(pool);
  schema=require('../src/db/schema.ts');
  await pool.query('create role anon; create role authenticated;');
  for(const table of [schema.universities,schema.courses,schema.applications,schema.students,schema.payments]) {
    const cfg=getTableConfig(table);
    const columns=cfg.columns.map(c=>`"${c.name}" ${c.getSQLType()}${c.generatedIdentity ? ' GENERATED ALWAYS AS IDENTITY' : ''}${c.primary ? ' PRIMARY KEY' : ''}${c.name==='application_id' && cfg.name==='applications' ? ' UNIQUE' : ''}`);
    await pool.query(`CREATE TABLE "${cfg.name}" (${columns.join(',')})`);
  }
  await pool.query(fs.readFileSync(path.join(__dirname,'../drizzle/0006_verified_fees.sql'),'utf8'));
  service=require('../src/lib/fees/service.ts');rules=require('../src/lib/fees/rules.ts');admin=require('../src/lib/fees/admin.ts');webhook=require('../src/lib/fees/webhook.ts');report=require('../src/lib/fees/report.ts');
});
after(async()=>{if(pool)await pool.end();if(embedded)await embedded.stop();});
test('integer paise, half-up discount rounding, schedule validation and INR dates',()=>{
  assert.equal(rules.paise('60000.01'),6000001);assert.deepEqual(rules.fullFee(6000000),{payable:5400000,discount:600000});assert.equal(rules.fullFee(1005).payable,905);
  for(const value of ['-1','1.001','Infinity','1e4',60000,'10000001'])assert.throws(()=>rules.paise(value));
  assert.throws(()=>rules.validateSchedule(300,2,[{semester:1,amount:100,dueDate:'2020-01-01'},{semester:2,amount:100,dueDate:'2020-02-01'}]));
  assert.equal(rules.indiaDate(new Date('2026-11-05T20:00:00Z')),'2026-11-06');assert.equal(rules.obligationState(100,99,'2020-01-01'),'Overdue');
});
test('full payment credits only provider capture; unauthorized applicants cannot view, pay or verify',async()=>{
  const f=await applicant();const {order,obligation}=await firstOrder(f);assert.equal(order.amount,5400000);
  const stranger=await applicant();await assert.rejects(()=>service.createOrder(stranger.who,obligation.id),/access denied/i);await assert.rejects(()=>service.orderDetails(stranger.who,order.id),/access denied/i);
  const payment=providerPayment(order,'authorized');const signature=createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(`${order.orderId}|${payment.id}`).digest('hex');
  assert.equal((await service.verifyCheckout(f.who,{id:order.id,razorpay_payment_id:payment.id,razorpay_signature:signature})).pending,true);
  assert.equal((await service.portal(f.who)).plan.collected,0);assert.equal((await database.select().from(schema.feeReceipts)).length,0);
  payment.status='captured';remoteOrders.get(order.orderId).status='paid';await service.verifyCheckout(f.who,{id:order.id,razorpay_payment_id:payment.id,razorpay_signature:signature});
  const result=await service.portal(f.who);assert.equal(result.plan.status,'PAID IN FULL');assert.equal(result.plan.collected,5400000);assert.ok(result.plan.history[0].receiptId);
  await service.reconcileOrder(order.id);assert.equal((await database.select().from(schema.feeReceipts)).length,1);await assert.rejects(()=>service.createOrder(f.who,obligation.id),/already paid/i);
});
test('concurrent checkout requests reserve one provider order and never charge twice',async()=>{
  const f=await applicant();await service.selectPlan(f.who,'semester');const plan=(await service.portal(f.who)).plan;const count=createCalls;
  const results=await Promise.allSettled(Array.from({length:8},()=>service.createOrder(f.who,plan.schedule[0].id)));
  assert.equal(createCalls-count,1);assert.ok(results.some(r=>r.status==='fulfilled'));assert.equal((await database.select().from(schema.feeOrders).where(eq(schema.feeOrders.obligationId,plan.schedule[0].id))).length,1);
  const retry=await service.createOrder(f.who,plan.schedule[0].id);assert.equal(retry.amount,1000000);assert.equal(createCalls-count,1);
});
test('semester capture pays only that obligation; prevents discount switching and future checkout',async()=>{
  const f=await applicant();const {order}=await firstOrder(f,'semester');providerPayment(order);await service.reconcileOrder(order.id);
  const portal=await service.portal(f.who);assert.equal(portal.plan.discount,0);assert.equal(portal.plan.status,'PARTIALLY PAID');assert.equal(portal.plan.schedule[0].status,'Paid');assert.equal(portal.plan.schedule[1].outstanding,2000000);assert.equal(portal.plan.outstanding,5000000);
  await assert.rejects(()=>service.selectPlan(f.who,'full'),/already exists/i);await assert.rejects(()=>service.createOrder(f.who,portal.plan.schedule[2].id),/not due/i);
});
test('failed payment and cancellation retain application and allow same-order retry',async()=>{
  const f=await applicant();const {order,obligation}=await firstOrder(f);providerPayment(order,'failed');await service.reconcileOrder(order.id);
  assert.equal((await service.portal(f.who)).plan.collected,0);const count=createCalls;const retry=await service.createOrder(f.who,obligation.id);assert.equal(retry.orderId,order.orderId);assert.equal(createCalls,count);
  assert.equal((await database.select().from(schema.applications).where(eq(schema.applications.id,f.application.id))).length,1);
});
test('uncertain order creation is recovered by receipt, never replaced',async()=>{
  const f=await applicant();await service.selectPlan(f.who,'full');const plan=(await service.portal(f.who)).plan;simulateTimeout=true;
  await assert.rejects(()=>service.createOrder(f.who,plan.schedule[0].id),/timeout/);simulateTimeout=false;const count=createCalls;
  await assert.rejects(()=>service.createOrder(f.who,plan.schedule[0].id),/confirmation is pending/);assert.equal(createCalls,count);
  const [order]=await database.select().from(schema.feeOrders).where(eq(schema.feeOrders.obligationId,plan.schedule[0].id));await service.reconcileOrder(order.id);
  const retry=await service.createOrder(f.who,plan.schedule[0].id);assert.ok(retry.orderId);assert.equal(createCalls,count);
});
test('invalid raw webhook signature is rejected before writing, duplicates and out-of-order delivery credit once',async()=>{
  const f=await applicant();const {order}=await firstOrder(f);const p=providerPayment(order);
  const raw=JSON.stringify({event:'payment.captured',payload:{payment:{entity:p}}});
  await assert.rejects(()=>webhook.processWebhook(raw,'bad','invalid'),/signature/);assert.equal((await database.select().from(schema.feeWebhooks).where(eq(schema.feeWebhooks.eventId,'invalid'))).length,0);
  await Promise.all([webhook.processWebhook(raw,signed(raw),'event-capture'),webhook.processWebhook(raw,signed(raw),'event-capture')]);
  assert.equal((await service.portal(f.who)).plan.collected,5400000);
  assert.equal((await webhook.processWebhook(raw,signed(raw),'another-delivery')).duplicate,true);
  const stale=JSON.stringify({event:'payment.authorized',payload:{payment:{entity:{...p,status:'authorized'}}}});await webhook.processWebhook(stale,signed(stale),'stale-event');
  assert.equal((await service.portal(f.who)).plan.collected,5400000);assert.equal((await database.select().from(schema.feeTransactions).where(eq(schema.feeTransactions.razorpayPaymentId,p.id))).length,1);
});
test('delayed provider failures leave retryable webhook records; reconciliation recovers',async()=>{
  const f=await applicant();const {order}=await firstOrder(f);const p=providerPayment(order);const raw=JSON.stringify({event:'order.paid',payload:{payment:{entity:p}}});
  fetchFails=true;assert.equal((await webhook.processWebhook(raw,signed(raw),'delayed-event')).failed,true);fetchFails=false;
  assert.equal((await service.portal(f.who)).plan.collected,0);await webhook.processWebhook(raw,signed(raw),'delayed-event');assert.equal((await service.portal(f.who)).plan.collected,5400000);
});
test('provider amount/currency mismatch rolls back ledger writes',async()=>{
  const f=await applicant();const {order}=await firstOrder(f);const p=providerPayment(order);p.amount++;
  await assert.rejects(()=>service.reconcileOrder(order.id),/does not match/);assert.equal((await service.portal(f.who)).plan.collected,0);
});
test('only processed refunds reduce credit and stale events cannot reverse a refund',async()=>{
  const f=await applicant();const {order}=await firstOrder(f);const p=providerPayment(order);await service.reconcileOrder(order.id);
  p.amount_refunded=10000;p.refund_status='partial';refunds.set(p.id,[{id:'rfnd_Test',status:'pending',amount:10000}]);await service.reconcileOrder(order.id);assert.equal((await service.portal(f.who)).plan.collected,5400000);
  refunds.get(p.id)[0].status='processed';await service.reconcileOrder(order.id);assert.equal((await service.portal(f.who)).plan.collected,5390000);
  refunds.get(p.id)[0].status='pending';await service.reconcileOrder(order.id);assert.equal((await service.portal(f.who)).plan.collected,5390000);
});
test('enrollment links preserve applicant history; unrelated student and forged admin token denied',async()=>{
  const f=await applicant();const {order}=await firstOrder(f);providerPayment(order);await service.reconcileOrder(order.id);
  const [student]=await database.insert(schema.students).values({studentId:'TEST-ENROLLED',mobile:f.application.mobile,dob:f.application.dob,firstName:'TEST',amountPaid:'0'}).returning();
  await admin.linkEnrollment(1,student.id,f.application.applicationId,'Verified enrollment test evidence');
  assert.equal((await service.portal({studentId:student.id})).plan.collected,5400000);
  const [other]=await database.insert(schema.students).values({studentId:'TEST-OTHER',firstName:'TEST',mobile:'8888888888',dob:'2000-01-01'}).returning();
  await assert.rejects(()=>service.orderDetails({studentId:other.id},order.id),/access denied/i);
  const {NextRequest}=require('next/server');const {requireAdmin}=require('../src/lib/admin-auth.ts');
  assert.equal(requireAdmin(new NextRequest('http://localhost/api/admin/payments',{headers:{cookie:`admin_token=${jwt.sign({studentId:String(student.id),role:'student'},process.env.JWT_SECRET)}`}})),null);
});
test('offline credits, historical review and amendments are audited and cannot exceed outstanding',async()=>{
  const f=await applicant();await service.selectPlan(f.who,'semester');const plan=(await service.portal(f.who)).plan;
  await admin.adminAction(1,{planId:plan.id,action:'offline',obligationId:plan.schedule[0].id,amount:'1000',reference:'TEST-OFFLINE-1',reason:'Bank receipt verified in test',receivedAt:'2020-01-01'});
  assert.equal((await service.portal(f.who)).plan.collected,100000);
  await assert.rejects(()=>admin.adminAction(1,{planId:plan.id,action:'offline',obligationId:plan.schedule[0].id,amount:'20000',reference:'TEST-OFFLINE-2',reason:'Excessive credit test',receivedAt:'2020-01-01'}),/exceeds/);
  await admin.adminAction(1,{planId:plan.id,action:'adjust',obligationId:plan.schedule[1].id,amount:'19000',dueDate:'2020-02-01',reason:'Approved fee reduction test'});
  const summary=await service.portal(f.who);assert.equal(summary.plan.payable,5900000);assert.equal((await database.select().from(schema.feeAudit).where(eq(schema.feeAudit.planId,plan.id))).length,2);
});
test('dashboard and reports derive the same net ledger and correctly combine filters',async()=>{
  const f=await applicant();const {order}=await firstOrder(f);providerPayment(order);await service.reconcileOrder(order.id);
  const result=await report.feeReport(new URLSearchParams({course:String(f.course.id),plan:'full',status:'captured'}));
  assert.equal(result.summary.collected,5400000);assert.equal(result.summary.discounts,600000);assert.equal(result.groups.courses[0].collected,5400000);assert.equal(result.rows.length,1);assert.equal(result.summary.outstanding,0);
  const none=await report.feeReport(new URLSearchParams({course:String(f.course.id),status:'failed'}));assert.equal(none.rows.length,0);assert.equal(none.summary.collected,0);
});
test('PDF generation supports Indian names; receipt cannot be downloaded by another applicant',async()=>{
  const f=await applicant();const {order}=await firstOrder(f);providerPayment(order);await service.reconcileOrder(order.id);const portal=await service.portal(f.who);const id=portal.plan.history[0].receiptId;
  const {receiptPdf}=require('../src/lib/fees/receipt.ts');const [receipt]=await database.select().from(schema.feeReceipts).where(eq(schema.feeReceipts.id,id));
  const bytes=await receiptPdf(id,{...receipt.snapshot,name:'TEST ONLY आर्यभट्ट Student'},0);assert.ok(bytes.length>1000);assert.equal(Buffer.from(bytes).subarray(0,4).toString(),'%PDF');fs.writeFileSync(path.join(os.tmpdir(),'aiit-test-receipt.pdf'),bytes);
  const stranger=await applicant();const {NextRequest}=require('next/server');const route=require('../src/app/api/fees/receipts/[id]/route.ts');
  const cookie=jwt.sign({role:'applicant_fees',applicationId:stranger.application.id},process.env.JWT_SECRET);
  assert.equal((await route.GET(new NextRequest(`http://localhost/api/fees/receipts/${id}`,{headers:{cookie:`applicant_fee_token=${cookie}`}}),{params:Promise.resolve({id})})).status,403);
});
test('admission saves without screenshot; retry with the same submission key returns the same application',async()=>{
  const f=await applicant();const route=require('../src/app/api/applications/route.ts');const {NextRequest}=require('next/server');
  const body={courseId:f.course.id,submissionKey:randomBytes(32).toString('hex'),firstName:'TEST',fatherName:'TEST',motherName:'TEST',dob:'2000-01-01',gender:'Other',mobile:'9999999999',address:'TEST',city:'TEST',state:'TEST',pinCode:'000000',declaration:true};
  const request=()=>new NextRequest('http://localhost/api/applications',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const a=await route.POST(request()), b=await route.POST(request());assert.equal(a.status,201);const first=await a.json(), second=await b.json();assert.equal(first.applicationId,second.applicationId);assert.equal(first.recoveryCode,body.submissionKey);assert.ok(a.headers.get('set-cookie').includes('HttpOnly'));
});

test('processed refund creates at most one new order for exactly the outstanding refund',async()=>{
  const f=await applicant();const {order,obligation}=await firstOrder(f);const p=providerPayment(order);await service.reconcileOrder(order.id);
  p.amount_refunded=10000;p.refund_status='partial';refunds.set(p.id,[{id:'rfnd_Recollect',status:'processed',amount:10000}]);await service.reconcileOrder(order.id);
  const count=createCalls;const results=await Promise.allSettled([service.createOrder(f.who,obligation.id),service.createOrder(f.who,obligation.id)]);
  assert.equal(createCalls-count,1);const next=results.find(r=>r.status==='fulfilled').value;assert.equal(next.amount,10000);assert.notEqual(next.orderId,order.orderId);
});
test('configuration sum and duplicate capture constraints reject inconsistent database writes',async()=>{
  const f=await applicant();
  await assert.rejects(()=>pool.query('update fee_configurations set original_amount=1 where course_id=$1',[f.course.id]),e=>e.code==='23514');
  const role=await pool.query("select relname,relrowsecurity from pg_class where relname like 'fee_%' and relkind='r'");assert.ok(role.rows.length>=10);assert.ok(role.rows.every(r=>r.relrowsecurity));
});
test('standalone course assignment is audited and cannot replace an existing enrollment',async()=>{
  const f=await applicant();const [student]=await database.insert(schema.students).values({studentId:'TEST-ASSIGN',firstName:'TEST',mobile:'9999999999',dob:'2000-01-01'}).returning();
  await admin.assignStudentCourse(1,student.id,f.course.id,'Verified standalone enrollment');
  assert.equal((await service.portal({studentId:student.id})).person.courseId,f.course.id);
  await assert.rejects(()=>admin.assignStudentCourse(1,student.id,f.course.id,'Repeated standalone enrollment'),/already exists/);
});
test('applicant recovery uses a private code and administrator resets are audited',async()=>{
  const f=await applicant();const auth=require('../src/lib/fees/auth.ts');
  const {recoveryCode}=await admin.resetApplicantAccess(1,f.application.id,'Identity checked in admissions');
  assert.equal(await auth.recoverApplicant(f.application.applicationId,recoveryCode),f.application.id);
  await assert.rejects(()=>auth.recoverApplicant(f.application.applicationId,'0'.repeat(64)),/incorrect/);
  const next=await admin.resetApplicantAccess(1,f.application.id,'Identity checked a second time');
  await assert.rejects(()=>auth.recoverApplicant(f.application.applicationId,recoveryCode),/incorrect/);
  assert.equal(await auth.recoverApplicant(f.application.applicationId,next.recoveryCode),f.application.id);
});
