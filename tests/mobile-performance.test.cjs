const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = (path) => fs.readFileSync(path, "utf8");

test("mobile skips desktop-only hero preload and defers large campus images", () => {
  const home = read("src/app/page.tsx");
  const desktopHero = home.slice(home.indexOf('src="/images/hero-bg.jpg"'), home.indexOf('src="/images/hero-bg.jpg"') + 250);
  assert.match(desktopHero, /loading="lazy"/);
  assert.doesNotMatch(desktopHero, /priority/);
  assert.doesNotMatch(home, /campus-3\.jpg/);
  for (const filename of ["campus-1.jpg", "campus-2.jpg"]) {
    const segment = home.slice(home.indexOf('src="/images/' + filename + '"'), home.indexOf('src="/images/' + filename + '"') + 220);
    assert.match(segment, /sizes=/);
    assert.match(segment, /loading="lazy"/);
  }
});

test("course browser limits initial cards while retaining filter and show more", () => {
  const browser = read("src/components/UniversityCourseBrowser.tsx");
  assert.match(browser, /const PAGE_SIZE = 12/);
  assert.match(browser, /filteredCourses\.slice\(0, visibleCount\)/);
  assert.match(browser, /filteredListings\.slice\(0, visibleCount\)/);
  assert.match(browser, /Show more courses/);
  assert.match(browser, /setVisibleCount\(PAGE_SIZE\)/);
});

test("student payment panel loads only on the requested tab", () => {
  const dashboard = read("src/components/StudentDashboard.tsx");
  assert.match(dashboard, /dynamic\(\(\) => import\("@\/components\/FeePanel"\)/);
  assert.match(dashboard, /tab === "fees"|tab==="fees"/);
});
