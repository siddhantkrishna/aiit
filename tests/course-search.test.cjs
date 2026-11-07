const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
require.extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(
  fs.readFileSync(filename, "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, filename);
const { universityCourses, matchingCourses, resolveTypedCourse, courseDisplayName, findDuplicateCourse } = require("../src/lib/course-search.ts");

const all = [
  { id: 1, name: "DCA", fullName: "Diploma in Computer Applications", studyMode: "Regular", universityId: null },
  { id: 2, name: "DCA", fullName: "Diploma in Computer Applications", studyMode: "Online", universityId: null },
  { id: 3, name: "MBA", fullName: "Master of Business Administration", studyMode: "Distance", universityId: 1 },
  { id: 4, name: "BCA", fullName: "Bachelor of Computer Applications", studyMode: "Regular", universityId: 2 },
  { id: 5, name: "PGDCA", fullName: "Post Graduate Diploma in Computer Applications", studyMode: "Regular", universityId: 2 },
];
test("university selection excludes courses assigned to other universities", () => {
  assert.deepEqual(universityCourses(all, 1).map(c => c.id), [1,2,3]);
  assert.deepEqual(universityCourses(all, 2).map(c => c.id), [1,2,4,5]);
  assert.equal(universityCourses(all, 0).length, 0);
});
test("search matches code, full name, and ignores case and excess whitespace", () => {
  assert.deepEqual(matchingCourses(all, "  MASTEr  OF BUSINESS "), [all[2]]);
  assert.deepEqual(matchingCourses(all, "pgdca"), [all[4]]);
  assert.deepEqual(matchingCourses(all, "dca").map(c=>c.id), [1,2,5]);
});
test("auto-selection is only possible with unambiguous matches", () => {
  assert.equal(resolveTypedCourse(all, "DCA"), undefined);
  assert.equal(resolveTypedCourse(all, "MBA")?.id, 3);
  assert.equal(resolveTypedCourse(all, "Bachelor of Computer")?.id, 4);
  assert.equal(resolveTypedCourse(all, "Regular"), undefined);
  assert.equal(resolveTypedCourse(all, ""), undefined);
  assert.equal(resolveTypedCourse(all, "m"), undefined);
});
test("typing the displayed course label selects the exact course even with duplicate codes", () => {
  const label = courseDisplayName(all[1]);
  assert.equal(resolveTypedCourse(all, label)?.id, 2);
  assert.equal(resolveTypedCourse(universityCourses(all, 1), "BCA"), undefined);
});

test("duplicate checks ignore punctuation, plural spelling and case", () => {
  const catalog = [
    { id: 1, name: "B.Pharma", fullName: "Bachelor of Pharmacy", studyMode: "Regular", universityId: null, enabled: true },
    { id: 2, name: "BCA", fullName: "Bachelor of Computer Applications", studyMode: "Regular", universityId: 3, enabled: true },
  ];
  assert.equal(findDuplicateCourse(catalog, {
    id: -1, name: "B.PHARMACY", fullName: "bachelor of pharmacy", studyMode: "regular", universityId: null,
  })?.id, 1);
  assert.equal(findDuplicateCourse(catalog, {
    id: -1, name: "BCA", fullName: "Bachelor of Computer Application", studyMode: "Regular", universityId: 3,
  })?.id, 2);
  assert.equal(findDuplicateCourse(catalog, catalog[0], 1), undefined);
});
test("distinct university and study-mode offerings are not duplicates", () => {
  const catalog = [{ id: 1, name: "DCA", fullName: "Diploma in Computer Applications", studyMode: "Regular", universityId: null, enabled: true }];
  assert.equal(findDuplicateCourse(catalog, { id: 2, name: "DCA", fullName: catalog[0].fullName, studyMode: "Online", universityId: null }), undefined);
  assert.equal(findDuplicateCourse(catalog, { id: 3, name: "DCA", fullName: catalog[0].fullName, studyMode: "Regular", universityId: 2 }), undefined);
  assert.equal(findDuplicateCourse([{ ...catalog[0], enabled: false }], { ...catalog[0], id: 4 }), undefined);
});
