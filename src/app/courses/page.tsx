import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UniversityCourseBrowser from "@/components/UniversityCourseBrowser";
import JsonLd from "@/components/JsonLd";
import { db } from "@/db";
import { courses, feeConfigurations, universities, universityFeeSources } from "@/db/schema";
import { asc, eq, lte } from "drizzle-orm";
import { indiaDate } from "@/lib/fees/rules";
import { buildUniversityCourseListings } from "@/lib/university-course-catalog";
import { SITE, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "University Courses & Fees | AIIT College",
  description: "Browse AIIT College courses and university-specific prices. Compare CVRU and SDMIT uploaded price lists, distinguish reference fees from approved fees, and enquire about admissions.",
  pathname: "/courses",
});

export default async function CoursesPage() {
  let universityRows: { id: number; name: string; shortName: string | null }[] = [];
  let courseRows: {
    id: number; name: string; fullName: string | null;
    universityId: number | null; studyMode: string | null;
    duration: string | null; eligibility: string | null;
    category: string | null; enabled: boolean;
  }[] = [];
  let sources: {
    id: number; universityId: number; courseName: string; studyMode: string;
    feeBasis: string; listedAmountPaise: number;
    duration: string | null; eligibility: string | null;
  }[] = [];
  let feeRows: {
    id: number; universityId: number; courseId: number;
    originalAmount: number; semesters: number; effectiveFrom: string;
  }[] = [];

  let dataAvailable = true;
  try {
    [universityRows, courseRows, sources, feeRows] = await Promise.all([
      db.select({
        id: universities.id,
        name: universities.name,
        shortName: universities.shortName,
      }).from(universities).where(eq(universities.enabled, true)).orderBy(asc(universities.id)),
      db.select({
        id: courses.id,
        name: courses.name,
        fullName: courses.fullName,
        universityId: courses.universityId,
        studyMode: courses.studyMode,
        duration: courses.duration,
        eligibility: courses.eligibility,
        category: courses.category,
        enabled: courses.enabled,
      }).from(courses).where(eq(courses.enabled, true)).orderBy(asc(courses.name)),
      db.select({
        id: universityFeeSources.id,
        universityId: universityFeeSources.universityId,
        courseName: universityFeeSources.courseName,
        studyMode: universityFeeSources.studyMode,
        feeBasis: universityFeeSources.feeBasis,
        listedAmountPaise: universityFeeSources.listedAmountPaise,
        duration: universityFeeSources.duration,
        eligibility: universityFeeSources.eligibility,
      }).from(universityFeeSources),
      db.select({
        id: feeConfigurations.id,
        universityId: feeConfigurations.universityId,
        courseId: feeConfigurations.courseId,
        originalAmount: feeConfigurations.originalAmount,
        semesters: feeConfigurations.semesters,
        effectiveFrom: feeConfigurations.effectiveFrom,
      }).from(feeConfigurations).where(lte(feeConfigurations.effectiveFrom, indiaDate())),
    ]);
  } catch (error) {
    console.error("Course catalogue could not be loaded:", error);
    dataAvailable = false;
  }

  const listings = buildUniversityCourseListings(sources, feeRows, courseRows);
  const activeUniversityIds = new Set(universityRows.map(university => university.id));
  const publicListings = listings.filter(item => activeUniversityIds.has(item.universityId));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <header className="bg-primary-dark py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Admissions & programmes</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Courses & University Fees</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-200">
              Select a university to explore its listed programmes and see available fee details.
              Approved fees and university price-list references are clearly distinguished.
            </p>
          </div>
        </header>

        {dataAvailable ? (
          <UniversityCourseBrowser universities={universityRows} listings={publicListings} courses={courseRows} />
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-20 text-center">
            <h2 className="text-xl font-semibold">Course information is temporarily unavailable</h2>
            <p className="mt-3 text-slate-600">Please try again later or contact admissions for current course and fee details.</p>
          </div>
        )}
      </main>

      <JsonLd data={courseRows.length >= 3 ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${SITE.url}/courses#course-list`,
        name: "AIIT College Courses",
        itemListElement: courseRows.map((course, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE.url}/courses#course-${course.id}`,
          item: {
            "@type": "Course",
            name: course.name,
            description: course.fullName ||
              `${course.name} course listed by AIIT College in Gharghoda, Raigarh, Chhattisgarh.`,
            provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
            courseMode: course.studyMode || undefined,
            educationalLevel: course.category || undefined,
          },
        })),
      } : null} />
      <Footer />
    </>
  );
}
