require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.SUPABASE_URL = 'https://storage.example.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-key';
let db;
require.cache[require.resolve('../src/db/index.ts')] = { exports: { get db() { return db; } } };
const storageObjects = new Map();
let bucketPublic = false;
const storage = { storage: { getBucket: async () => ({ data: { public: bucketPublic } }), from: () => ({
  upload: async (key, bytes) => { storageObjects.set(key, bytes); return {}; },
  remove: async keys => { keys.forEach(key => storageObjects.delete(key)); return {}; },
  createSignedUrl: async (key, seconds) => ({ data: { signedUrl: `https://storage.example.test/signed/${key}?expires=${seconds}` } }),
}) } };
require.cache[require.resolve('../src/lib/supabase.ts')] = { exports: { supabase: storage } };
const { NextRequest } = require('next/server');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const schema = require('../src/db/schema.ts');
const { requireAdmin } = require('../src/lib/admin-auth.ts');
const { paise, rupees } = require('../src/lib/payment-balance.ts');
const validation = require('../src/lib/validation.ts');
const privateStorage = require('../src/lib/private-storage.ts');
const adminToken = jwt.sign({ id: 1, role: 'admin', email: 'owner@example.test' }, process.env.JWT_SECRET, { audience: 'aiit-admin', issuer: 'aiit' });
function request(url, body, token = adminToken, method = 'POST') {
  return new NextRequest(`https://aiit.example.test${url}`, { method, headers: { cookie: `admin_token=${token}`, 'content-type': 'application/json' }, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) });
}
const context = id => ({ params: Promise.resolve({ id: String(id) }) });

test('admin sessions require role, audience, issuer, algorithm and valid ID', () => {
  const req = token => ({ cookies: { get: () => ({ value: token }) } });
  assert.equal(requireAdmin(req(adminToken)).id, 1);
  for (const token of [jwt.sign({ id: 1 }, process.env.JWT_SECRET), jwt.sign({ id: 1, role: 'student' }, process.env.JWT_SECRET, { audience: 'aiit-admin', issuer: 'aiit' }), jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS384', audience: 'aiit-admin', issuer: 'aiit' })]) assert.equal(requireAdmin(req(token)), null);
});

test('money calculations retain exact paise and reject malformed or unsafe amounts', () => {
  assert.equal(paise('0.10') + paise('0.20'), 30);
  assert.equal(rupees(30), '0.30'); assert.equal(paise('123456789.99'), 12345678999);
  for (const value of ['-1', '1.001', 'Infinity', 'NaN', '1e5', '1000000000', '']) assert.throws(() => paise(value));
  assert.throws(() => rupees(-1)); assert.throws(() => rupees(1.2));
});

test('server validation catches invalid dates, money, attendance chronology and missing task owners', () => {
  assert.equal(validation.date.safeParse('2026-02-30').success, false);
  assert.equal(validation.date.safeParse('2024-02-29').success, true);
  assert.equal(validation.money.safeParse('12.345').success, false);
  assert.equal(validation.taskSchema.safeParse({ taskName: 'Follow-up', dueDate: '2026-11-04' }).success, false);
  assert.equal(validation.attendanceSchema.safeParse({ staffId: 1, attendanceDate: '2026-11-03', checkIn: '2026-11-03T10:00:00Z', checkOut: '2026-11-03T09:00:00Z' }).success, false);
});

test('storage accepts only trusted paths, validates magic bytes, refuses public buckets', async () => {
  assert.equal(privateStorage.storagePath('applications/one/photo.jpg'), 'applications/one/photo.jpg');
  assert.equal(privateStorage.storagePath('https://storage.example.test/storage/v1/object/public/documents/a/b.pdf'), 'a/b.pdf');
  for (const value of ['../secret', '/absolute', 'a/../b', 'https://other.example.test/storage/v1/object/public/documents/a.pdf', 'a/../../b', 'a\\b']) assert.throws(() => privateStorage.storagePath(value));
  await assert.rejects(() => privateStorage.validateUpload(new File(['not a PDF'], 'file.pdf', { type: 'application/pdf' })));
  await privateStorage.validateUpload(new File(['%PDF-1.4\n'], 'file.pdf', { type: 'application/pdf' }));
  const word = new File([new Uint8Array([208,207,17,224,161,177,26,225])], 'resume.doc', { type: 'application/msword' });
  await assert.rejects(() => privateStorage.validateUpload(word));
  await privateStorage.validateUpload(word, false, true);
  bucketPublic = true; await assert.rejects(() => privateStorage.requirePrivateBucket()); bucketPublic = false;
  assert.match(await privateStorage.signDocument('a/b.pdf'), /expires=120/);
});

test('cross-site mutations and oversized JSON are rejected before processing', () => {
  const { validateRequest } = require('../src/lib/request-security.ts');
  const badOrigin = new NextRequest('https://aiit.example.test/api/applications', { method: 'POST', headers: { origin: 'https://attacker.example.test' } });
  assert.equal(validateRequest(badOrigin).status, 403);
  const large = new NextRequest('https://aiit.example.test/api/student/login', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '1000000' } });
  assert.equal(validateRequest(large).status, 413);
  assert.equal(validateRequest(new NextRequest('https://aiit.example.test/api/student/login', { method: 'POST', headers: { origin: 'https://aiit.example.test' } })), null);
});

test('the src-level proxy redirects private pages and blocks cross-site requests', async () => {
  const { proxy, config } = require('../src/proxy.ts');
  assert.deepEqual(config.matcher, ['/api/:path*', '/admin/dashboard/:path*']);
  const dashboard = await proxy(new NextRequest('https://aiit.example.test/admin/dashboard'));
  assert.equal(dashboard.status, 307); assert.match(dashboard.headers.get('location'), /admin\/login/);
  const denied = await proxy(new NextRequest('https://aiit.example.test/api/admin/students'));
  assert.equal(denied.status, 401);
  const crossSite = await proxy(new NextRequest('https://aiit.example.test/api/applications', { method: 'POST', headers: { origin: 'https://attacker.example.test' } }));
  assert.equal(crossSite.status, 403);
});

test('every private route rejects missing auth before database access', async () => {
  const root = path.resolve('src/app/api/admin');
  for (const file of fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith('route.ts'))) {
    if (['login', 'logout', 'verify'].includes(file.split(path.sep)[0])) continue;
    const route = require(path.join(root, file));
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      if (!route[method]) continue;
      const response = await route[method](request(`/api/admin/${file}`, {}, '', method), context(1));
      assert.equal(response.status, 401, `${file} ${method}`);
    }
  }
  for (const name of ['courses', 'universities', 'applications']) {
    for (const file of ['route.ts', '[id]/route.ts']) {
      const route = require(path.resolve(`src/app/api/${name}/${file}`));
      for (const method of ['POST', 'PUT', 'DELETE']) {
        if (!route[method] || name === 'applications' && method === 'POST') continue;
        assert.equal((await route[method](request(`/api/${name}`, {}, '', method), context(1))).status, 401);
      }
    }
  }
});

test('seeding HTTP endpoint is permanently disabled', async () => {
  const route = require('../src/app/api/seed/route.ts');
  assert.equal((await route.POST()).status, 410);
});

test('workflow integration on isolated PostgreSQL', { skip: !process.env.AIIT_TEST_PGLITE_MODULE || !process.env.AIIT_TEST_SCHEMA }, async t => {
  const { PGlite } = require(process.env.AIIT_TEST_PGLITE_MODULE);
  const { drizzle } = require('drizzle-orm/pglite');
  const pg = new PGlite();
  await pg.exec(fs.readFileSync(process.env.AIIT_TEST_SCHEMA, 'utf8'));
  // Exercise the additive migration against pre-change student/staff tables.
  await pg.exec('alter table students drop column access_code_hash, drop column father_name, drop column mother_name, drop column university_status, drop column university_submitted_at, drop column university_next_action, drop column required_documents, drop column admit_card_path; alter table staff drop column responsibilities; alter table applications drop column qualification;');
  await pg.exec(fs.readFileSync('drizzle/0004_secure_operations.sql', 'utf8'));
  await pg.exec(fs.readFileSync('drizzle/0004_secure_operations.sql', 'utf8'));
  db = drizzle(pg);
  const [centre] = await db.insert(schema.centres).values({ code: 'GHARGHODA', name: 'Gharghoda' }).returning();
  const [course] = await db.insert(schema.courses).values({ name: 'Verified course', studyMode: 'Regular', verificationStatus: 'VERIFIED' }).returning();
  const [employee] = await db.insert(schema.staff).values({ employeeId: 'TEST-STAFF', name: 'Test employee' }).returning();
  const [application] = await db.insert(schema.applications).values({ applicationId: 'AIIT-TEST-001', courseId: course.id, centreId: centre.id, studyMode: 'Regular', firstName: 'Test', fatherName: 'Father', motherName: 'Mother', dob: '2000-01-01', gender: 'Other', mobile: '9876543210', address: 'Test address', city: 'Test city', state: 'Chhattisgarh', pinCode: '496111', declaration: true }).returning();
  const appRoute = require('../src/app/api/applications/[id]/route.ts');
  const paymentRoute = require('../src/app/api/admin/payments/route.ts');
  const studentRoute = require('../src/app/api/admin/students/route.ts');
  const receiptRoute = require('../src/app/api/admin/payments/[id]/receipt/route.ts');
  await t.test('approval requires verification, records history and creates one student on repeated requests', async () => {
    assert.equal((await appRoute.PUT(request('/api/applications/1', { applicationStatus: 'APPROVED' }), context(application.id))).status, 400);
    for (let i = 0; i < 2; i++) assert.equal((await appRoute.PUT(request('/api/applications/1', { applicationStatus: 'APPROVED', documentStatus: 'VERIFIED', verificationStatus: 'VERIFIED', remarks: 'Checked' }), context(application.id))).status, 200);
    const records = await db.select().from(schema.students); assert.equal(records.length, 1); assert.equal(records[0].fatherName, 'Father');
    const [updated] = await db.select().from(schema.applications); assert.equal(updated.applicationStatus, 'APPROVED'); assert.equal(updated.status, 'approved');
    assert.equal((await db.select().from(schema.applicationStatusHistory)).length, 2);
  });
  const [student] = await db.select().from(schema.students);
  await t.test('manual student creation rejects duplicate identity', async () => {
    const response = await studentRoute.POST(request('/api/admin/students', { firstName: 'Test', mobile: '9876543210', dob: '2000-01-01', courseId: course.id, centreId: centre.id, admissionDate: '2026-11-03' }));
    assert.equal(response.status, 409);
  });
  let payment;
  await t.test('new payments stay pending; verification is atomic and idempotent', async () => {
    assert.equal((await studentRoute.PUT(request('/api/admin/students', { id: student.id, totalFee: '1000.00' }, adminToken, 'PUT'))).status, 200);
    const response = await paymentRoute.POST(request('/api/admin/payments', { studentId: student.id, centreId: centre.id, paymentDate: '2026-11-03', paymentType: 'TUITION', paymentMode: 'UPI', amount: '300.10', referenceNumber: 'TX-001', paymentStatus: 'VERIFIED' }));
    assert.equal(response.status, 201); payment = (await response.json()).payment; assert.equal(payment.paymentStatus, 'PENDING');
    assert.equal((await receiptRoute.GET(request('/receipt', null, adminToken, 'GET'), context(payment.id))).status, 409);
    for (let i = 0; i < 2; i++) assert.equal((await paymentRoute.PUT(request('/api/admin/payments', { id: payment.id, paymentStatus: 'VERIFIED' }, adminToken, 'PUT'))).status, 200);
    const [updated] = await db.select().from(schema.students); assert.equal(updated.amountPaid, '300.10'); assert.equal(updated.amountPending, '699.90');
    assert.equal((await db.select().from(schema.accountingTransactions)).length, 1);
    const receipt = await receiptRoute.GET(request('/receipt', null, adminToken, 'GET'), context(payment.id)); assert.equal(receipt.status, 200); assert.match(Buffer.from(await receipt.arrayBuffer()).toString(), /^%PDF-/);
  });
  await t.test('duplicate verified transaction references cannot inflate collections', async () => {
    const response = await paymentRoute.POST(request('/api/admin/payments', { studentId: student.id, paymentDate: '2026-11-03', paymentType: 'TUITION', paymentMode: 'UPI', amount: '300.10', referenceNumber: 'tx-001' }));
    const duplicate = (await response.json()).payment;
    assert.equal((await paymentRoute.PUT(request('/api/admin/payments', { id: duplicate.id, paymentStatus: 'VERIFIED' }, adminToken, 'PUT'))).status, 409);
  });
  await t.test('refund reverses once and invalidates receipt', async () => {
    for (let i = 0; i < 2; i++) assert.equal((await paymentRoute.PUT(request('/api/admin/payments', { id: payment.id, paymentStatus: 'REFUNDED' }, adminToken, 'PUT'))).status, 200);
    const [updated] = await db.select().from(schema.students); assert.equal(updated.amountPaid, '0.00'); assert.equal(updated.amountPending, '1000.00');
    const [ledger] = await db.select().from(schema.accountingTransactions); assert.equal(ledger.status, 'VOID');
    assert.equal((await receiptRoute.GET(request('/receipt', null, adminToken, 'GET'), context(payment.id))).status, 409);
  });
  await t.test('status lookup requires all identifiers and returns no personal record or remarks', async () => {
    const route = require('../src/app/api/applications/status/route.ts');
    assert.equal((await route.POST(request('/api/applications/status', { applicationId: application.applicationId }))).status, 400);
    assert.equal((await route.POST(request('/api/applications/status', { applicationId: application.applicationId, mobile: '9876543211', dob: '2000-01-01' }))).status, 404);
    const response = await route.POST(request('/api/applications/status', { applicationId: application.applicationId, mobile: '9876543210', dob: '2000-01-01' })); assert.equal(response.status, 200);
    const [value] = await response.json(); for (const key of ['mobile','dob','address','firstName','remarks','documents']) assert.equal(key in value, false);
  });
  await t.test('attendance check-out updates one record and derives working hours', async () => {
    const route = require('../src/app/api/admin/attendance/route.ts');
    for (const checkOut of [null, '2026-11-03T11:30:00Z']) {
      const response = await route.POST(request('/api/admin/attendance', { staffId: employee.id, centreId: centre.id, attendanceDate: '2026-11-03', checkIn: '2026-11-03T03:30:00Z', checkOut, lateMinutes: 10, leaveStatus: 'PRESENT' })); assert.equal(response.status, 200);
    }
    const records = await db.select().from(schema.staffAttendance); assert.equal(records.length, 1); assert.equal(records[0].workingHours, '8.00'); assert.equal(records[0].leaveStatus, 'LATE');
  });
  await t.test('shared rate limiting survives handler instances and fails at threshold', async () => {
    const { rateLimit } = require('../src/lib/request-security.ts');
    for (let i = 0; i < 2; i++) assert.equal(await rateLimit(request('/test', {}), 'test-limit', 2), null);
    assert.equal((await rateLimit(request('/test', {}), 'test-limit', 2)).status, 429);
  });
  await t.test('student access requires issued code; rotation revokes existing sessions', async () => {
    const { authenticateStudent, createStudentSession, getStudentFromRequest } = require('../src/lib/student-auth.ts');
    assert.equal(await authenticateStudent(student.studentId, '9876543210', '2000-01-01', 'wrong-code'), null);
    const issued = await studentRoute.PUT(request('/api/admin/students', { id: student.id, action: 'issue-access-code' }, adminToken, 'PUT')); const { accessCode } = await issued.json();
    const authenticated = await authenticateStudent(student.studentId, '9876543210', '2000-01-01', accessCode); assert.ok(authenticated);
    const token = createStudentSession(student.id, authenticated.accessCodeHash); const req = new NextRequest('https://aiit.example.test/api/student/me', { headers: { cookie: `student_token=${token}` } });
    assert.equal(await getStudentFromRequest(req), String(student.id));
    await studentRoute.PUT(request('/api/admin/students', { id: student.id, action: 'issue-access-code' }, adminToken, 'PUT'));
    assert.equal(await getStudentFromRequest(req), null);
    const response = await studentRoute.GET(request('/api/admin/students', null, adminToken, 'GET')); assert.equal(JSON.stringify(await response.json()).includes('accessCodeHash'), false);
  });
  await t.test('admission submission uploads private documents and binds later screenshots to its cookie', async () => {
    const route = require('../src/app/api/applications/route.ts');
    const form = new FormData();
    const fields = { courseId: String(course.id), centreId: String(centre.id), universityId: '', studyMode: 'Regular', firstName: 'New student', fatherName: 'Father', motherName: 'Mother', dob: '2001-01-01', gender: 'Other', mobile: '9876543211', address: 'Address', city: 'City', state: 'Chhattisgarh', pinCode: '496111', declaration: 'true', qualification: '10th' };
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    form.set('photo', new File([new Uint8Array([255,216,255])], 'photo.jpg', { type: 'image/jpeg' }));
    for (const type of ['aadhaar','tenthMarksheet']) form.set(type, new File(['%PDF-1.4\n'], `${type}.pdf`, { type: 'application/pdf' }));
    const response = await route.POST(new NextRequest('https://aiit.example.test/api/applications', { method: 'POST', body: form }));
    assert.equal(response.status, 201); const value = await response.json(); assert.ok(value.applicationId); assert.equal(value.status, 'pending'); assert.equal('application' in value, false);
    const docs = await db.select().from(schema.documents).where(eq(schema.documents.applicationId, value.applicationId)); assert.equal(docs.length, 3); assert.ok(docs.every(doc => !doc.filePath.startsWith('http')));
    const cookie = response.headers.get('set-cookie').split(';')[0]; assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
    function screenshotRequest(authorized) {
      const body = new FormData(); body.set('applicationId', value.applicationId); body.set('paymentScreenshot', new File([new Uint8Array([255,216,255])], 'proof.jpg', { type: 'image/jpeg' }));
      return new NextRequest('https://aiit.example.test/api/applications', { method: 'POST', body, headers: authorized ? { cookie } : {} });
    }
    assert.equal((await route.POST(screenshotRequest(false))).status, 403);
    assert.equal((await route.POST(screenshotRequest(true))).status, 200);
    const before = await db.select().from(schema.payments); const [created] = await db.select().from(schema.applications).where(eq(schema.applications.applicationId, value.applicationId)); assert.ok(before.every(p => p.applicationId !== created.id));
  });
  await t.test('catalogues publish only verified records and keep private fields server-side', async () => {
    await db.insert(schema.courses).values({ name: 'Unverified', studyMode: 'Distance', notes: 'Private note', verificationStatus: 'PENDING' });
    const route = require('../src/app/api/courses/route.ts');
    const response = await route.GET(request('/api/courses', null, '', 'GET')); const courses = await response.json();
    assert.equal(courses.length, 1); assert.equal(courses[0].name, 'Verified course'); assert.equal('notes' in courses[0], false); assert.equal('aiitCommission' in courses[0], false);
  });
  await t.test('dashboard and reports query real tables and count verified collections only', async () => {
    const stats = await require('../src/app/api/admin/stats/route.ts').GET(request('/stats', null, adminToken, 'GET')); assert.equal(stats.status, 200);
    const value = await stats.json(); assert.equal(value.collections, 0); assert.equal(value.pendingfees, 1000); assert.ok(value.pending >= 1);
    const report = await require('../src/app/api/admin/reports/route.ts').GET(request('/reports', null, adminToken, 'GET')); assert.equal(report.status, 200); assert.equal((await report.json()).monthly.collections, 0);
  });
  await t.test('payment failure rolls back balance and status together', async () => {
    const response = await paymentRoute.POST(request('/api/admin/payments', { studentId: student.id, paymentDate: '2026-11-03', paymentType: 'TUITION', paymentMode: 'CASH', amount: '25.00' }));
    const candidate = (await response.json()).payment;
    await db.insert(schema.accountingTransactions).values([1,2].map(n => ({ transactionCode: `LEGACY-DUPLICATE-${n}`, transactionType: 'INCOME', category: 'TUITION', amount: '25.00', relatedPaymentId: candidate.id })));
    assert.equal((await paymentRoute.PUT(request('/api/admin/payments', { id: candidate.id, paymentStatus: 'VERIFIED' }, adminToken, 'PUT'))).status, 409);
    const [updated] = await db.select().from(schema.students).where(eq(schema.students.id, student.id)); assert.equal(updated.amountPaid, '0.00');
    const [pending] = await db.select().from(schema.payments).where(eq(schema.payments.id, candidate.id)); assert.equal(pending.paymentStatus, 'PENDING');
  });
  await t.test('storage cutover retains objects and restricts anonymous access only for documents', async () => {
    await pg.exec("create role anon; create role authenticated; create schema storage; create table storage.buckets (id text primary key, public boolean); create table storage.objects (id text primary key, bucket_id text); insert into storage.buckets values ('documents',true),('assets',true); insert into storage.objects values ('private-file','documents'),('public-file','assets'); alter table storage.objects enable row level security; grant usage on schema storage to anon, authenticated; grant all on storage.objects to anon, authenticated; create policy existing_open_policy on storage.objects for all to anon, authenticated using (true) with check (true);");
    const cutover = fs.readFileSync('scripts/private-storage-cutover.sql', 'utf8'); await pg.exec(cutover); await pg.exec(cutover);
    assert.equal((await pg.query("select public from storage.buckets where id='documents'")).rows[0].public, false);
    assert.equal((await pg.query('select count(*)::int as count from storage.objects')).rows[0].count, 2);
    await pg.exec('set role anon');
    const visible = await pg.query('select id from storage.objects'); assert.deepEqual(visible.rows.map(row => row.id), ['public-file']);
    await assert.rejects(() => pg.query("insert into storage.objects values ('forbidden','documents')"));
    await pg.exec('reset role');
  });
  await pg.close();
});
