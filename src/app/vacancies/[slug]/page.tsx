import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/db";
import { vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [job] = await db.select().from(vacancies).where(eq(vacancies.slug, slug));
  return { title: job ? `${job.title} - AIIT College` : "Vacancy - AIIT College" };
}

export default async function VacancyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [job] = await db.select().from(vacancies).where(eq(vacancies.slug, slug));
  if (!job || !job.enabled) notFound();
  return <><Navbar/><main className="bg-background">
    <section className="bg-primary-dark text-white"><div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <Link href="/vacancies" className="text-sm text-blue-200 hover:text-white">← Back to vacancies</Link>
      <p className="text-sm font-semibold text-primary-light uppercase tracking-wider mt-8">{job.department}</p>
      <h1 className="text-4xl md:text-5xl font-bold mt-2">{job.title}</h1>
      <div className="flex flex-wrap gap-3 mt-6 text-sm"><span className="px-3 py-1.5 rounded-full bg-white/10">{job.employmentType}</span><span className="px-3 py-1.5 rounded-full bg-white/10">{job.location}</span><span className="px-3 py-1.5 rounded-full bg-white/10">{job.openings} opening{job.openings === 1 ? "" : "s"}</span></div>
    </div></section>
    <section className="py-14 md:py-20"><div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_300px] gap-8">
      <div className="space-y-6">
        <div className="bg-white border border-border rounded-xl p-6"><h2 className="text-lg font-bold mb-3">About the role</h2><p className="text-muted leading-relaxed">{job.description}</p></div>
        <div className="bg-white border border-border rounded-xl p-6"><h2 className="text-lg font-bold mb-3">Responsibilities</h2><p className="text-muted leading-relaxed whitespace-pre-line">{job.responsibilities}</p></div>
        <div className="bg-white border border-border rounded-xl p-6"><h2 className="text-lg font-bold mb-3">Qualifications</h2><p className="text-muted leading-relaxed whitespace-pre-line">{job.qualifications}</p></div>
      </div>
      <aside className="bg-white border border-border rounded-xl p-6 h-fit lg:sticky lg:top-24"><p className="text-sm text-muted">Experience</p><p className="font-semibold mt-1">{job.experience}</p><p className="text-sm text-muted mt-5">Salary</p><p className="font-semibold mt-1">{job.salary}</p><Link href={`/vacancies/${job.slug}/apply`} className="block mt-7 text-center px-5 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">Apply for this role</Link></aside>
    </div></section>
  </main><Footer/></>;
}
