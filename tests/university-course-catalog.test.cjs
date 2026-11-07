const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");

require.extensions[".ts"] = (mod, filename) => mod._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  filename,
);

const { buildUniversityCourseListings, readableSourceTitle } =
  require("../src/lib/university-course-catalog.ts");

const source = (id, universityId, courseName, mode, basis, amount) => ({
  id,
  universityId,
  courseName,
  studyMode: mode,
  feeBasis: basis,
  listedAmountPaise: amount,
  duration: null,
  eligibility: null,
});

test("repeated fee-source courses collapse without losing conflicting prices", () => {
  const rows = [
    source(1, 1, "B.COM", "IODE", "UNSPECIFIED_TOTAL", 1692000),
    source(2, 1, "b.com", "IODE", "UNSPECIFIED_TOTAL", 1542000),
    source(3, 1, "B.COM", "PRIVATE", "PER_YEAR", 2532000),
  ];
  const result = buildUniversityCourseListings(rows, [], []);
  assert.equal(result.length, 2);
  const iode = result.find(row => row.mode === "IODE");
  assert.equal(iode.status, "conflict");
  assert.equal(iode.amountPaise, 1542000);
  assert.equal(iode.maximumAmountPaise, 1692000);
  assert.equal(iode.basis, "UNSPECIFIED_TOTAL");
  const annual = result.find(row => row.mode === "PRIVATE");
  assert.equal(annual.status, "reference");
  assert.equal(annual.basis, "PER_YEAR");
  assert.equal(annual.amountPaise, 2532000);
});

test("same course at different universities is never collapsed", () => {
  const result = buildUniversityCourseListings([
    source(1, 1, "DCA", "PRIVATE", "PER_YEAR", 1660000),
    source(2, 4, "DCA", "CERTIFICATE", "LISTED_COURSE_TOTAL", 1300000),
  ], [], []);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map(row => row.universityId), [1, 4]);
});

test("an approved configuration overrides one unambiguous matching source listing", () => {
  const rows = [source(56, 4, "DCA", "CERTIFICATE", "LISTED_COURSE_TOTAL", 1300000)];
  const courses = [{ id: 1, name: "DCA", fullName: "Diploma in Computer Applications",
    enabled: true, studyMode: "Regular", universityId: null, duration: "1 Year", eligibility: "10th Pass" }];
  const fees = [{ id: 3, courseId: 1, universityId: 4, originalAmount: 1300000, semesters: 2, effectiveFrom: "2026-11-06" }];
  const [result] = buildUniversityCourseListings(rows, fees, courses);
  assert.equal(result.status, "approved");
  assert.equal(result.courseId, 1);
  assert.equal(result.basis, "APPROVED_TOTAL");
  assert.equal(result.duration, "1 Year");
});

test("ambiguous study-mode variants must not inherit an unrelated approved fee", () => {
  const rows = [
    source(1, 1, "BA", "IODE", "UNSPECIFIED_TOTAL", 1500000),
    source(2, 1, "BA", "PRIVATE", "PER_YEAR", 1500000),
  ];
  const courses = [{ id: 11, name: "BA", enabled: true, universityId: null, studyMode: "Distance" }];
  const fees = [{ id: 1, universityId: 1, courseId: 11, originalAmount: 2000000, semesters: 6, effectiveFrom: "2026-11-07" }];
  const result = buildUniversityCourseListings(rows, fees, courses);
  assert.equal(result.length, 3);
  assert.equal(result.filter(row => row.status === "approved").length, 1);
  assert.equal(result.filter(row => row.status === "reference").length, 2);
});

test("later approved versions win and disabled or mismatched course records are excluded", () => {
  const courses = [
    { id: 1, name: "DCA", enabled: true, universityId: 4, studyMode: "Regular" },
    { id: 2, name: "MBA", enabled: false, universityId: null, studyMode: "Regular" },
  ];
  const fees = [
    { id: 1, universityId: 4, courseId: 1, originalAmount: 1000000, semesters: 2, effectiveFrom: "2026-10-01" },
    { id: 2, universityId: 4, courseId: 1, originalAmount: 1300000, semesters: 2, effectiveFrom: "2026-11-06" },
    { id: 3, universityId: 1, courseId: 1, originalAmount: 500000, semesters: 2, effectiveFrom: "2026-11-06" },
    { id: 4, universityId: 4, courseId: 2, originalAmount: 2500000, semesters: 2, effectiveFrom: "2026-11-06" },
  ];
  const listings = buildUniversityCourseListings([], fees, courses);
  assert.equal(listings.length, 1);
  assert.equal(listings[0].amountPaise, 1300000);
});

test("uploaded title typos are corrected for public display without changing source rows", () => {
  const raw = "MA SOSIOLOGY";
  assert.equal(readableSourceTitle(raw), "MA (Sociology)");
  assert.equal(raw, "MA SOSIOLOGY");
  assert.equal(readableSourceTitle("AI PROMPT ENGI."), "AI Prompt Engineering");
});
