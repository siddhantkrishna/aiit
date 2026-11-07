"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ListedCourse, UniversityCourseListing } from "@/lib/university-course-catalog";

type University = { id: number; name: string; shortName: string | null };

type Props = {
  universities: University[];
  listings: UniversityCourseListing[];
  courses: ListedCourse[];
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const money = (paise: number) => currencyFormatter.format(paise / 100);
const PAGE_SIZE = 12;

const categoryColors: Record<string, string> = {
  Computer: "border-blue-200 bg-blue-50 text-blue-700",
  University: "border-violet-200 bg-violet-50 text-violet-700",
  Education: "border-green-200 bg-green-50 text-green-700",
  Medical: "border-red-200 bg-red-50 text-red-700",
  Professional: "border-amber-200 bg-amber-50 text-amber-700",
};

const priceBasis: Record<UniversityCourseListing["basis"], string> = {
  APPROVED_TOTAL: "Approved total programme fee",
  PER_YEAR: "Uploaded fee list · per year",
  LISTED_COURSE_TOTAL: "Uploaded fee list · listed course total",
  UNSPECIFIED_TOTAL: "Uploaded fee list · period unconfirmed",
};

function PriceCard({ listing }: { listing: UniversityCourseListing }) {
  const isApproved = listing.status === "approved";
  const isConflict = listing.status === "conflict";
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          {isApproved
            ? `${listing.mode.toLowerCase()} programme`
            : listing.mode === "CERTIFICATE"
              ? "Certificate price list"
              : `${listing.mode} price list`}
        </span>
        {isApproved && (
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            Approved price
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">{listing.title}</h3>
      {(listing.duration || listing.eligibility) && (
        <div className="mt-3 space-y-1 text-sm text-slate-600">
          {listing.duration && <p>Duration: <span className="font-medium text-slate-800">{listing.duration}</span></p>}
          {listing.eligibility && <p>Eligibility: <span className="font-medium text-slate-800">{listing.eligibility}</span></p>}
        </div>
      )}
      <div className="mt-auto border-t border-slate-100 pt-5">
        <p className="text-xs font-medium text-slate-500">{priceBasis[listing.basis]}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          {money(listing.amountPaise)}
          {isConflict && <span className="text-lg"> – {money(listing.maximumAmountPaise)}</span>}
          {listing.basis === "PER_YEAR" && <span className="ml-1 text-sm font-medium text-slate-500">/ year</span>}
        </p>
        {isConflict ? (
          <p className="mt-2 text-xs leading-relaxed text-amber-800">
            Conflicting amounts in the supplied fee sheets. Confirm the correct figure with admissions.
          </p>
        ) : !isApproved ? (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Reference amount only. Not an approved final fee or payment quote.
          </p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-emerald-800">
            Approved university-specific fee. Any payment discount or instalment plan is confirmed during admission.
          </p>
        )}
        <Link
          href={isApproved ? "/admission" : "/online-inquiry"}
          className={`mt-4 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${isApproved
            ? "bg-primary text-white hover:bg-primary-dark"
            : "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"}`}
        >
          {isApproved ? "Apply for admission" : "Enquire about this course"}
        </Link>
      </div>
    </article>
  );
}

function GeneralCourseCard({ course }: { course: ListedCourse & { category?: string | null } }) {
  return (
    <article id={`course-${course.id}`} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <span className={`w-fit rounded-md border px-2.5 py-1 text-xs font-medium ${categoryColors[course.category || ""] || "border-slate-200 bg-slate-50 text-slate-600"}`}>
        {course.category || "Course"}
      </span>
      <h3 className="mt-3 text-lg font-bold text-slate-900">{course.name}</h3>
      {course.fullName && <p className="mt-1 text-sm text-slate-600">{course.fullName}</p>}
      <div className="mt-4 space-y-1 text-sm text-slate-600">
        {course.duration && <p>Duration: {course.duration}</p>}
        {course.eligibility && <p>Eligibility: {course.eligibility}</p>}
        {course.studyMode && <p>Mode: {course.studyMode}</p>}
      </div>
      <div className="mt-auto pt-5">
        <p className="mb-3 text-xs text-slate-500">Select a university for verified fee details.</p>
        <Link href="/admission" className="block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-dark">
          Apply for admission
        </Link>
      </div>
    </article>
  );
}

export default function UniversityCourseBrowser({ universities, listings, courses }: Props) {
  const firstWithPrices = universities.find(uni => listings.some(item => item.universityId === uni.id));
  const [selection, setSelection] = useState(firstWithPrices ? String(firstWithPrices.id) : "all");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const showingAll = selection === "all";
  const selectedUniversity = universities.find(u => String(u.id) === selection);
  const universityListings = useMemo(
    () => listings.filter(item => item.universityId === Number(selection)),
    [listings, selection],
  );
  const modes = [...new Set(universityListings.map(item => item.mode))].sort();
  const query = search.trim().toLocaleLowerCase();
  const filteredListings = universityListings.filter(item =>
    (mode === "all" || item.mode === mode) &&
    (!query || [item.title, item.mode].some(value => value.toLocaleLowerCase().includes(query))),
  );
  const filteredCourses = courses.filter(course =>
    !query || [course.name, course.fullName ?? "", course.category ?? ""]
      .some(value => value.toLocaleLowerCase().includes(query)),
  );

  const displayedCourses = filteredCourses.slice(0, visibleCount);
  const displayedListings = filteredListings.slice(0, visibleCount);
  const resultCount = showingAll ? filteredCourses.length : filteredListings.length;

  function selectUniversity(id: string) {
    setSelection(id);
    setSearch("");
    setMode("all");
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Course catalogue</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Choose your university
          </h2>
        </div>
        <p className="text-sm text-slate-500">Scroll horizontally to browse universities</p>
      </div>

      <div aria-label="Filter courses by university" className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {universities.map(uni => {
          const active = selection === String(uni.id);
          const count = listings.filter(item => item.universityId === uni.id).length;
          return (
            <button key={uni.id} type="button" onClick={() => selectUniversity(String(uni.id))}
              aria-pressed={active}
              className={`shrink-0 snap-start rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"}`}>
              <span className="block text-sm font-bold">{uni.shortName || uni.name}</span>
              <span className={`mt-0.5 block text-xs ${active ? "text-white/80" : "text-slate-500"}`}>{count} priced listings</span>
            </button>
          );
        })}
        <button type="button" onClick={() => selectUniversity("all")} aria-pressed={showingAll}
          className={`shrink-0 snap-start rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${showingAll
            ? "border-primary bg-primary text-white"
            : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"}`}>
          <span className="block text-sm font-bold">All AIIT courses</span>
          <span className={`mt-0.5 block text-xs ${showingAll ? "text-white/80" : "text-slate-500"}`}>{courses.length} general listings</span>
        </button>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{showingAll ? "All AIIT courses" : selectedUniversity?.name || "University courses"}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {showingAll
              ? "Browse the general catalogue. Course availability and fees depend on the selected university."
              : `${universityListings.length} course-price listings from existing university fee records.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="course-catalog-search">Search courses</label>
          <input id="course-catalog-search" type="search" value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder="Search courses…" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary sm:w-60" />
          {!showingAll && modes.length > 1 && (
            <>
              <label className="sr-only" htmlFor="course-mode-filter">Course mode</label>
              <select id="course-mode-filter" value={mode} onChange={e => { setMode(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
                <option value="all">All modes</option>
                {modes.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {!showingAll && universityListings.length > 0 && (
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
          Only prices marked <strong>Approved price</strong> are approved programme fees. Other figures come from uploaded fee lists and require confirmation. Annual amounts are not full-course totals; conflicting and unspecified totals are labelled.
        </p>
      )}

      {!showingAll && universityListings.length === 0 ? (
        <div className="py-16 text-center">
          <h3 className="text-xl font-semibold text-slate-900">University-specific fees not published yet</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
            We do not yet have a university-specific course price list for {selectedUniversity?.name}. Fees and availability will appear here when they are added and verified.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={() => selectUniversity("all")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Browse all courses</button>
            <Link href="/online-inquiry" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">Enquire</Link>
          </div>
        </div>
      ) : showingAll ? (
        filteredCourses.length ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedCourses.map(course => <GeneralCourseCard key={course.id} course={course} />)}
          </div>
        ) : <p className="py-12 text-center text-slate-600">No courses match your search.</p>
      ) : filteredListings.length ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedListings.map(item => <PriceCard key={item.key} listing={item} />)}
        </div>
      ) : <p className="py-12 text-center text-slate-600">No courses match these filters.</p>}
      {resultCount > 0 && (showingAll || universityListings.length > 0) && (
        <div className="mt-7 flex flex-col items-center gap-3">
          <p className="text-sm text-slate-600" role="status">
            Showing {Math.min(visibleCount, resultCount)} of {resultCount} courses
          </p>
          {resultCount > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
              className="min-h-11 rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Show more courses
            </button>
          )}
        </div>
      )}
    </section>
  );
}
