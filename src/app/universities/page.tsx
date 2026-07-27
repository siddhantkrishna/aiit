import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/db";
import { universities } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function UniversitiesPage() {
  let allUniversities: (typeof universities.$inferSelect)[] = [];
  try {
    allUniversities = await db.select().from(universities).where(eq(universities.enabled, true));
  } catch {
    allUniversities = [];
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="bg-primary-dark text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Partner Universities
            </h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              AIIT College is affiliated with reputed universities recognized by
              UGC and other regulatory bodies.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {allUniversities.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-2xl">🏛️</p>
                <p className="text-muted mt-2">University details coming soon.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {allUniversities.map((uni) => (
                  <div
                    key={uni.id}
                    className="bg-white rounded-xl border border-border p-8 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-lg">
                          {uni.shortName || uni.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-foreground">
                          {uni.name}
                        </h2>
                        {uni.shortName && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                            {uni.shortName}
                          </span>
                        )}
                        {uni.location && (
                          <p className="text-sm text-muted mt-2">
                            📍 {uni.location}
                          </p>
                        )}
                        {uni.description && (
                          <p className="text-muted mt-3 leading-relaxed">
                            {uni.description}
                          </p>
                        )}
                        {uni.website && (
                          <a
                            href={uni.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-sm text-primary hover:underline"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
