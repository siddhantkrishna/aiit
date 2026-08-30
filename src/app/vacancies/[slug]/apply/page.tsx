import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/db";
import { vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";
import VacancyApplicationForm from "./VacancyApplicationForm";

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [job] = await db.select().from(vacancies).where(eq(vacancies.slug, slug));
  if (!job || !job.enabled) notFound();
  return <><Navbar/><main className="bg-background py-14 md:py-20" aria-labelledby="application-title"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <p className="text-sm font-semibold text-primary uppercase tracking-wider">Career Application</p>
    <h1 id="application-title" className="text-3xl md:text-4xl font-bold mt-2">Apply for {job.title}</h1>
    <p className="text-muted mt-2 mb-8">Complete the form below and submit your resume.</p>
    <VacancyApplicationForm vacancyId={job.id} title={job.title}/>
  </div></main><Footer/></>;
}
