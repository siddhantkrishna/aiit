import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

const categoryColors: Record<string, string> = {
  Computer: "bg-blue-50 text-blue-700 border-blue-200",
  University: "bg-purple-50 text-purple-700 border-purple-200",
  Education: "bg-green-50 text-green-700 border-green-200",
  Medical: "bg-red-50 text-red-700 border-red-200",
  Professional: "bg-amber-50 text-amber-700 border-amber-200",
};

export default async function CoursesPage() {
  let allCourses: (typeof courses.$inferSelect)[] = [];
  try {
    allCourses = await db.select().from(courses).where(eq(courses.enabled, true));
  } catch {
    allCourses = [];
  }

  const categories = [...new Set(allCourses.map((c) => c.category).filter(Boolean))];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-primary-dark text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Courses</h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              Explore our comprehensive range of courses designed to build your
              career in technology, education, and professional fields.
            </p>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {allCourses.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-2xl">📚</p>
                <p className="text-muted mt-2">Courses will be available soon. Please check back later.</p>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category} className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                        categoryColors[category || ""] || "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {category}
                    </span>
                    <span className="text-muted text-sm font-normal">
                      ({allCourses.filter((c) => c.category === category).length} courses)
                    </span>
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allCourses
                      .filter((c) => c.category === category)
                      .map((course) => (
                        <div
                          key={course.id}
                          className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                        >
                          <h3 className="text-lg font-bold text-foreground">
                            {course.name}
                          </h3>
                          <p className="text-sm text-muted mt-1 mb-3">
                            {course.fullName}
                          </p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted">Duration:</span>
                              <span className="font-medium">{course.duration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Eligibility:</span>
                              <span className="font-medium text-right max-w-[60%]">
                                {course.eligibility}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Mode:</span>
                              <span className="font-medium">{course.studyMode}</span>
                            </div>
                          </div>
                          <Link
                            href={`/admission?course=${course.id}`}
                            className="mt-4 block w-full text-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            Apply Now
                          </Link>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
