const { test, before, after } = require("node:test");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  Module = require("node:module"),
  ts = require("typescript");
const { Pool } = require("pg"),
  { drizzle } = require("drizzle-orm/node-postgres"),
  { eq, and } = require("drizzle-orm"),
  jwt = require("jsonwebtoken");
const { NextRequest } = require("next/server");
process.env.JWT_SECRET = "attendance-test-secret-only";
let embedded, pool, db, s, server, rules, route, employees;
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === "@/db") {
    assert.ok(db, "Only the isolated database is allowed");
    return { db, pool };
  }
  if (name.startsWith("@/"))
    name = path.join(__dirname, "../src", name.slice(2));
  return originalLoad.call(this, name, ...args);
};
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
const adminToken = jwt.sign(
  { id: 1, email: "attendance-test@example.invalid" },
  process.env.JWT_SECRET,
);
function request(
  method,
  body,
  query = "",
  cookie = `admin_token=${adminToken}`,
  origin = "http://localhost",
) {
  return new NextRequest("http://localhost/api/admin/attendance" + query, {
    method,
    headers: { cookie, origin, "content-type": "application/json" },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
}
function input(staffId, date, changes = {}) {
  return {
    staffId,
    attendanceDate: date,
    leaveStatus: "PRESENT",
    shiftStart: "09:00",
    checkIn: `${date}T09:15`,
    checkOut: `${date}T17:00`,
    ...changes,
  };
}
before(async () => {
  const Embedded = (await import("embedded-postgres")).default;
  const net = require("node:net"),
    listener = net.createServer();
  await new Promise((r) => listener.listen(0, "127.0.0.1", r));
  const port = listener.address().port;
  await new Promise((r) => listener.close(r));
  const password = require("node:crypto").randomBytes(16).toString("hex");
  embedded = new Embedded({
    databaseDir: fs.mkdtempSync(path.join(os.tmpdir(), "aiit-attendance-")),
    port,
    user: "postgres",
    password,
    persistent: false,
    autoRehydrateSymlinks: true,
    postgresFlags: ["-h", "127.0.0.1"],
    onLog: () => {},
    onError: () => {},
  });
  await embedded.initialise();
  await embedded.start();
  pool = new Pool({
    host: "127.0.0.1",
    port,
    user: "postgres",
    password,
    database: "postgres",
    max: 10,
  });
  db = drizzle(pool);
  await pool.query(`create role anon; create role authenticated;
 create table staff (id bigint generated always as identity primary key,employee_id varchar(100) not null unique,name varchar(255) not null,role varchar(100),department varchar(100),centre_id integer,joining_date date,employment_type varchar(100),salary numeric,manager_id bigint,status varchar(50) default 'ACTIVE',email varchar(255),mobile varchar(30),created_at timestamp not null default now(),updated_at timestamp);
 create table staff_attendance (id bigint generated always as identity primary key,staff_id bigint not null references staff(id),centre_id integer,attendance_date date not null,check_in timestamptz,check_out timestamptz,working_hours numeric,late_minutes integer default 0,leave_status varchar(50) default 'PRESENT',created_at timestamptz not null default now(),unique(staff_id,attendance_date));`);
  s = require("../src/db/schema.ts");
  employees = await db
    .insert(s.staff)
    .values([
      {
        employeeId: "EMP-001",
        name: "Test Official Faculty",
        department: "Academics",
        joiningDate: "2026-01-01",
      },
      {
        employeeId: "EMP-002",
        name: "Test Official Coordinator",
        department: "Student Services",
        joiningDate: "2026-01-01",
      },
      ...[1, 2, 3].map((i) => ({
        employeeId: `DEMO-EMP-00${i}`,
        name: `DEMO — Test Staff ${i}`,
        department: i === 3 ? "Student Services" : "Academics",
      })),
    ])
    .returning();
  // Existing values are not rewritten by NOT VALID checks or the additive migration.
  await pool.query(
    "insert into staff_attendance(staff_id,attendance_date,check_in,check_out,working_hours) values($1,'2026-01-02','2026-01-02 09:00+05:30','2026-01-02 17:00+05:30',6)",
    [employees[0].id],
  );
  await pool.query(
    fs.readFileSync(
      path.join(__dirname, "../drizzle/0007_staff_attendance.sql"),
      "utf8",
    ),
  );
  rules = require("../src/lib/attendance/rules.ts");
  server = require("../src/lib/attendance/server.ts");
  route = require("../src/app/api/admin/attendance/route.ts");
});
after(async () => {
  if (pool) await pool.end();
  if (embedded) await embedded.stop();
});
test("additive migration preserves old values, is repeatable, and retains the employee/date unique constraint", async () => {
  await pool.query(
    fs.readFileSync(
      path.join(__dirname, "../drizzle/0007_staff_attendance.sql"),
      "utf8",
    ),
  );
  const legacy = await pool.query(
    "select working_hours from staff_attendance where attendance_date='2026-01-02'",
  );
  assert.equal(Number(legacy.rows[0].working_hours), 6);
  assert.equal(
    (
      await pool.query(
        "select relrowsecurity from pg_class where relname='staff_attendance'",
      )
    ).rows[0].relrowsecurity,
    true,
  );
});
test("India dates, leap months, hours and lateness do not depend on browser or process timezone", () => {
  const now = new Date("2026-11-06T12:00:00Z");
  assert.equal(rules.indiaDate(new Date("2026-11-05T20:00Z")), "2026-11-06");
  assert.equal(
    rules.indiaDateTime(new Date("2026-11-05T20:00Z")),
    "2026-11-06T01:30:00",
  );
  assert.deepEqual(rules.monthRange("2028-02"), {
    from: "2028-02-01",
    to: "2028-02-29",
  });
  const r = rules.attendanceValues(
    input(1, "2026-11-02", { workingHours: 999, lateMinutes: 999 }),
    now,
  );
  assert.equal(r.workingHours, "7.75");
  assert.equal(r.lateMinutes, 15);
  assert.equal(r.checkIn.toISOString(), "2026-11-02T03:45:00.000Z");
  const overnight = rules.attendanceValues(
    input(1, "2026-11-02", {
      shiftStart: "22:00",
      checkIn: "2026-11-02T22:00",
      checkOut: "2026-11-03T06:00",
    }),
    now,
  );
  assert.equal(overnight.workingHours, "8.00");
});
test("invalid dates, times, future attendance, reversed/long shifts, and absent/leave timestamps are rejected", () => {
  const now = new Date("2026-11-06T12:00Z");
  for (const changes of [
    { attendanceDate: "2026-02-30" },
    { attendanceDate: "2026-11-07" },
    { leaveStatus: "UNKNOWN" },
    { checkIn: "2026-11-02T25:00" },
    { checkIn: "2026-11-01T09:00" },
    { checkIn: "2026-11-02T09:00Z" },
    { checkIn: "", checkOut: "2026-11-02T17:00" },
    { checkOut: "2026-11-02T08:00" },
    { checkOut: "2026-11-04T10:00" },
    { leaveStatus: "ABSENT" },
    { leaveStatus: "LEAVE" },
    { shiftStart: "" },
    { notes: "x".repeat(1001) },
  ])
    assert.throws(() =>
      rules.attendanceValues(input(1, "2026-11-02", changes), now),
    );
  assert.equal(
    rules.attendanceValues(
      input(1, "2026-11-02", {
        checkIn: null,
        checkOut: null,
        leaveStatus: "HALF DAY",
      }),
      now,
    ).workingHours,
    null,
  );
});
test("attendance and CSV endpoints require admin authentication and reject student tokens and cross-origin writes", async () => {
  assert.equal((await route.GET(request("GET", null, "", ""))).status, 401);
  const token = jwt.sign(
    { studentId: "1", role: "student" },
    process.env.JWT_SECRET,
  );
  assert.equal(
    (
      await route.GET(
        request("GET", null, "?export=csv", `admin_token=${token}`),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await route.POST(
        request(
          "POST",
          input(employees[0].id, "2026-11-02"),
          "",
          undefined,
          "https://outside.invalid",
        ),
      )
    ).status,
    403,
  );
});
test("create derives hours, lateness, department/centre and DEMO metadata on the server", async () => {
  const response = await route.POST(
    request("POST", {
      ...input(employees[0].id, "2026-11-02"),
      workingHours: "999",
      lateMinutes: 999,
      isDemo: true,
      centreId: 999,
    }),
  );
  assert.equal(response.status, 201);
  const row = (await response.json()).attendance[0];
  assert.equal(row.workingHours, "7.75");
  assert.equal(row.lateMinutes, 15);
  assert.equal(row.isDemo, false);
  assert.equal(row.centreId, null);
  assert.equal(row.markedBy, 1);
});
test("search casts date to text and combines employee, department and status filters using AND", async () => {
  const response = await route.GET(
    request(
      "GET",
      null,
      "?from=2026-11-01&to=2026-11-30&search=2026-11-02&department=Academics&status=PRESENT",
    ),
  );
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.equal(report.rows.length, 1);
  assert.equal(report.officialMonthly.present, 1);
  const none = await route.GET(
    request("GET", null, "?search=Official%20Faculty&status=ABSENT"),
  );
  assert.equal((await none.json()).rows.length, 0);
  assert.equal(
    (await route.GET(request("GET", null, "?from=bad"))).status,
    400,
  );
  assert.equal(
    (await route.GET(request("GET", null, "?from=2026-11-03&to=2026-11-01")))
      .status,
    400,
  );
});
test("all staff appear in the day roster, including unmarked staff and employee/department filtering", async () => {
  const response = await route.GET(request("GET", null, "?date=2026-11-03"));
  const data = await response.json();
  assert.equal(data.roster.length, 5);
  assert.ok(data.roster.every((r) => r.record === null));
  assert.equal(data.roster.filter((r) => r.isDemo).length, 3);
  const one = await route.GET(
    request(
      "GET",
      null,
      `?date=2026-11-03&staffId=${employees[1].id}&department=Student%20Services`,
    ),
  );
  assert.equal((await one.json()).roster.length, 1);
});
test("bulk marking is atomic; invalid employees and duplicate rows do not save a partial batch", async () => {
  const before = await pool.query(
    "select count(*)::int n from staff_attendance where attendance_date='2026-11-03'",
  );
  assert.equal(
    (
      await route.POST(
        request("POST", {
          records: [
            input(employees[0].id, "2026-11-03"),
            input(999999, "2026-11-03"),
          ],
        }),
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await pool.query(
        "select count(*)::int n from staff_attendance where attendance_date='2026-11-03'",
      )
    ).rows[0].n,
    before.rows[0].n,
  );
  const duplicate = input(employees[0].id, "2026-11-03");
  assert.equal(
    (await route.POST(request("POST", { records: [duplicate, duplicate] })))
      .status,
    409,
  );
});
test("parallel duplicate creates produce one row and a clear conflict response", async () => {
  const body = input(employees[0].id, "2026-11-03");
  const responses = await Promise.all([
    route.POST(request("POST", body)),
    route.POST(request("POST", body)),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    (
      await pool.query(
        "select count(*)::int n from staff_attendance where staff_id=$1 and attendance_date='2026-11-03'",
        [employees[0].id],
      )
    ).rows[0].n,
    1,
  );
});
test("record edits recalculate hours and stale concurrent edits cannot overwrite a newer record", async () => {
  const [original] = await db
    .select()
    .from(s.staffAttendance)
    .where(
      and(
        eq(s.staffAttendance.staffId, employees[0].id),
        eq(s.staffAttendance.attendanceDate, "2026-11-03"),
      ),
    );
  const body = {
    ...input(employees[0].id, "2026-11-03", {
      checkOut: "2026-11-03T13:00",
      leaveStatus: "HALF DAY",
    }),
    id: original.id,
    version: original.version,
  };
  assert.equal((await route.PUT(request("PUT", body))).status, 200);
  assert.equal((await route.PUT(request("PUT", body))).status, 409);
  const [updated] = await db
    .select()
    .from(s.staffAttendance)
    .where(eq(s.staffAttendance.id, original.id));
  assert.equal(updated.workingHours, "3.75");
  assert.equal(updated.version, 2);
});
test("bulk create/edit supports all statuses and rolls back every edit on an optimistic conflict", async () => {
  const records = ["PRESENT", "ABSENT", "HALF DAY", "LEAVE"].map(
    (leaveStatus, i) =>
      input(employees[1].id, `2026-11-0${i + 1}`, {
        leaveStatus,
        checkIn: null,
        checkOut: null,
      }),
  );
  assert.equal((await route.POST(request("POST", { records }))).status, 201);
  const existing = await db
    .select()
    .from(s.staffAttendance)
    .where(eq(s.staffAttendance.staffId, employees[1].id));
  const edits = existing.map((r) => ({
    ...input(r.staffId, r.attendanceDate, { checkIn: null, checkOut: null }),
    id: r.id,
    version: r.version,
  }));
  edits[edits.length - 1].version = 999;
  assert.equal(
    (await route.PUT(request("PUT", { records: edits }))).status,
    409,
  );
  const after = await db
    .select()
    .from(s.staffAttendance)
    .where(eq(s.staffAttendance.staffId, employees[1].id));
  assert.ok(after.every((r) => r.version === 1));
});
test("check-in/check-out use server India time and reject repeat or stale clock actions", async () => {
  const now = new Date("2026-11-06T03:42:00Z");
  const [row] = await server.clockAttendance(
    1,
    { staffId: employees[0].id, action: "check_in", shiftStart: "09:00" },
    now,
  );
  assert.equal(row.lateMinutes, 12);
  assert.equal(row.workingHours, null);
  await assert.rejects(
    () =>
      server.clockAttendance(
        1,
        { staffId: row.staffId, action: "check_in", version: row.version },
        now,
      ),
    /already checked in/,
  );
  const [closed] = await server.clockAttendance(
    1,
    { staffId: row.staffId, action: "check_out", version: row.version },
    new Date("2026-11-06T11:30:00Z"),
  );
  assert.equal(closed.workingHours, "7.80");
  await assert.rejects(
    () =>
      server.clockAttendance(
        1,
        { staffId: row.staffId, action: "check_out", version: closed.version },
        now,
      ),
    /open check-in/,
  );
});
test("15 seeded examples use existing DEMO employees, are repeatable, and never enter official dashboards or exports", async () => {
  const seed = fs.readFileSync(
    path.join(__dirname, "../scripts/seed_demo_attendance.sql"),
    "utf8",
  );
  await pool.query(seed);
  await pool.query(seed);
  const response = await route.GET(
    request(
      "GET",
      null,
      "?date=2026-10-30&month=2026-10&from=2026-10-26&to=2026-10-30&scope=demo",
    ),
  );
  const data = await response.json();
  assert.equal(data.total, 15);
  assert.equal(data.rows.filter((r) => r.isDemo).length, 15);
  assert.equal(data.matchingSummary.hours, "79.76");
  assert.equal(data.matchingSummary.late, 4);
  assert.equal(data.officialMonthly.total, 0);
  assert.equal(data.officialDaily.total, 0);
  assert.equal(new Set(data.rows.map((r) => r.record.staffId)).size, 3);
  const official = await route.GET(
    request(
      "GET",
      null,
      "?from=2026-10-26&to=2026-10-30&scope=official&export=csv",
    ),
  );
  assert.ok(!(await official.text()).includes("DEMO —"));
  const csv = await route.GET(
    request(
      "GET",
      null,
      "?from=2026-10-26&to=2026-10-30&scope=demo&export=csv",
    ),
  );
  const text = await csv.text();
  assert.equal(text.split("\r\n").length, 16);
  assert.ok(text.includes('"DEMO"'));
  assert.ok(text.includes("2026-10-27T09:20:00"));
});
test("demo flag cannot be forged and official reporting also excludes demo employee identities", async () => {
  const r = await route.POST(
    request("POST", { ...input(employees[2].id, "2026-11-02"), isDemo: false }),
  );
  assert.equal((await r.json()).attendance[0].isDemo, true);
  await pool.query(
    "update staff_attendance set is_demo=false where staff_id=$1 and attendance_date='2026-11-02'",
    [employees[2].id],
  );
  const official = await route.GET(
    request(
      "GET",
      null,
      `?month=2026-11&scope=official&staffId=${employees[2].id}`,
    ),
  );
  assert.equal((await official.json()).total, 0);
});
test("database constraints reject fabricated hours; new records cannot predate employment", async () => {
  await assert.rejects(
    () =>
      pool.query(
        "insert into staff_attendance(staff_id,attendance_date,check_in,check_out,working_hours,late_minutes,leave_status) values($1,'2026-11-05','2026-11-05 09:00+05:30','2026-11-05 17:00+05:30',999,0,'PRESENT')",
        [employees[0].id],
      ),
    (e) => e.code === "23514",
  );
  const r = await route.POST(
    request("POST", input(employees[0].id, "2025-12-31")),
  );
  assert.equal(r.status, 400);
});
test("CSV escapes spreadsheet formulas and staff profile is protected", async () => {
  assert.equal(rules.csvCell("=SUM(1,2)"), `"'=SUM(1,2)"`);
  assert.ok(rules.csvCell(" \t+cmd").startsWith("\"'"));
  const profile = require("../src/app/api/admin/staff/[id]/route.ts");
  assert.equal(
    (
      await profile.GET(request("GET", null, "", ""), {
        params: Promise.resolve({ id: String(employees[0].id) }),
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await profile.GET(request("GET", null), {
        params: Promise.resolve({ id: String(employees[0].id) }),
      })
    ).status,
    200,
  );
});

test('malformed payloads return validation errors and browser database roles cannot read attendance', async () => {
  assert.equal((await route.POST(request('POST', null))).status, 400);
  assert.equal((await route.PUT(request('PUT', []))).status, 400);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE anon');
    await assert.rejects(() => client.query('SELECT * FROM staff_attendance'), error => error.code === '42501');
  } finally { await client.query('ROLLBACK'); client.release(); }
});
