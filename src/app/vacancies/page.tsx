import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/db";
import { vacancies } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Vacancies - AIIT College",
  description: "Explore current job opportunities at AIIT College and apply for open positions.",
};

export default async function VacanciesPage() {
  const jobs = await db.select().from(vacancies).where(eq(vacancies.enabled, true)).orderBy(asc(vacancies.id));
  return <><Navbar/><main className="bg-background" aria-labelledby="vacancies-title">
    <section className="bg-primary-dark text-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
      <p className="text-sm font-semibold text-primary-light uppercase tracking-wider mb-3">Careers at AIIT</p>
      <h1 id="vacancies-title" className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">Grow your career while shaping the future of education.</h1>
      <p className="mt-5 max-w-2xl text-lg text-blue-200">Join the AIIT College team and explore our current opportunities.</p>
    </div></section>
    <section className="py-16 md:py-24"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12"><p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Open Positions</p><h2 className="text-3xl md:text-4xl font-bold">Current opportunities at AIIT</h2></div>
      {jobs.length === 0 ? <div className="bg-white border border-border rounded-xl p-10 text-center text-muted">There are no open positions at the moment.</div> :
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{jobs.map(job => <article key={job.id} className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider">{job.department || "AIIT College"}</p>
        <h3 className="text-xl font-bold mt-2">{job.title}</h3>
        <p className="text-sm text-muted mt-4">{job.employmentType || "Full-time"} · {job.location || "AIIT College"}</p>
        <div className="flex flex-wrap gap-2 mt-3"><span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{job.openings} opening{job.openings === 1 ? "" : "s"}</span><span className="px-2.5 py-1 rounded-full bg-gray-50 text-muted text-xs font-medium">{job.experience || "Experience varies"}</span></div>
        <p className="text-sm text-muted leading-relaxed mt-4">{job.description}</p>
        <Link href={`/vacancies/${job.slug}`} className="inline-flex mt-6 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">View Role →</Link>
      </article>)}</div>}
    </div></section>
  </main><Footer/></>;
}
