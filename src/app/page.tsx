import { db } from "@/db";
import { courses as courseTable, universities as universityTable, centres } from "@/db/schema";
import { publicCourse, publicUniversity } from "@/lib/catalogue";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { SITE, pageMetadata } from "@/lib/seo";

const features = [
  {
    icon: "🎓",
    title: "University Programs",
    desc: "Explore verified university programs and admission guidance",
  },
  {
    icon: "💻",
    title: "Computer Education",
    desc: "Explore current computer courses in our verified catalogue",
  },
  {
    icon: "📚",
    title: "Distance Education",
    desc: "Ask about permitted modes for your selected program",
  },
  {
    icon: "🏆",
    title: "Skill Development",
    desc: "Industry-ready professional certifications",
  },
  {
    icon: "🌐",
    title: "Online Education",
    desc: "Check verified online options for your selected program",
  },
  {
    icon: "📋",
    title: "Career Guidance",
    desc: "Expert counseling for your career path",
  },
];

const admissionSteps = [
  { step: "01", title: "Choose Course", desc: "Browse our courses and select the right program" },
  { step: "02", title: "Fill Application", desc: "Complete the online admission form" },
  { step: "03", title: "Upload Documents", desc: "Submit required documents digitally" },
  { step: "04", title: "Get Admitted", desc: "Receive confirmation and start learning" },
];

const faqs = [
  {
    q: "What courses does AIIT College offer?",
    a: "Our Courses page lists currently verified programs. Contact AIIT to confirm eligibility, fees and availability for your selected program.",
  },
  {
    q: "Which universities are affiliated with AIIT?",
    a: "The Universities page lists relationships verified by AIIT. Contact the office for current authorization and program details.",
  },
  {
    q: "How can I apply for admission?",
    a: "You can apply online through our Admission Portal. Fill in your details, upload required documents, and submit your application. No login is required.",
  },
  {
    q: "What documents are required for admission?",
    a: "You need a passport photo, Aadhaar card, 10th marksheet, 12th marksheet, and graduation marksheet (if applicable).",
  },
  {
    q: "How can I check my application status?",
    a: "Visit the 'Check Status' page and enter your Application Number or Mobile Number to see your application status.",
  },
  {
    q: "Is distance education available?",
    a: "Permitted study modes vary by program. Check the verified course listing and confirm the mode with AIIT before applying.",
  },
];

export const metadata = pageMetadata({
  title: "AIIT College Gharghoda | Aryabhatta Institute of Information Technology",
  description:
    "AIIT College is an educational institution in Gharghoda, Raigarh, Chhattisgarh offering computer education, university programs, distance education, online education, skill development, and professional courses.",
  pathname: "/",
  keywords: [
    "AIIT College Gharghoda",
    "Aryabhatta Institute of Information Technology",
    "college in Gharghoda",
    "college in Raigarh",
    "college in Chhattisgarh",
    "computer education Gharghoda",
    "AIIT admission",
  ],
});

export default async function HomePage() {
  let universities: { name: string; short: string; desc: string }[] = [];
  let availableModes: string[] = [];
  let courseCount = 0;
  let centreCount = 0;
  try {
    const [verifiedUniversities, verifiedCourses, activeCentres] = await Promise.all([
      db.select().from(universityTable).where(publicUniversity), db.select().from(courseTable).where(publicCourse), db.select({ id: centres.id }).from(centres).where(eq(centres.status, "ACTIVE")),
    ]);
    universities = verifiedUniversities.map(u => ({ name: u.name, short: u.shortName || u.name.charAt(0), desc: u.description || "Contact AIIT for current program details." }));
    availableModes = [...new Set(verifiedCourses.map(c => c.studyMode).filter((mode): mode is string => !!mode))];
    courseCount = verifiedCourses.length; centreCount = activeCentres.length;
  } catch { /* Keep public information unavailable until it can be verified. */ }
  const stats = [{ value: String(centreCount), label: "Centres" }, { value: String(courseCount), label: "Verified Courses" }, { value: String(universities.length), label: "Verified Universities" }, { value: "Online", label: "Admission Applications" }];
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative bg-primary-dark text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-dark opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
                <span className="text-primary-light">●</span>
                Admissions Open 2026-27
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Shape Your Future at{" "}
                <span className="text-primary-light">AIIT College</span>
              </h1>
              <p className="text-lg text-blue-200 mb-8 max-w-lg">
                Aryabhatta Institute of Information Technology in Gharghoda,
                Raigarh, Chhattisgarh — empowering students with quality
                education in Computer Science, Information Technology,
                professional education, and skill development.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admission"
                  className="px-6 py-3 bg-white text-primary-dark font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Apply for Admission →
                </Link>
                <Link
                  href="/online-inquiry"
                  className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Enquiry →
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <Image
                src="/images/hero-bg.jpg"
                alt="AIIT College Campus"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                About AIIT College
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Excellence in Education Since Establishment
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Aryabhatta Institute of Information Technology (AIIT) College is
                an educational institution in Gharghoda, Raigarh, Chhattisgarh,
                dedicated to providing quality education in Computer Science,
                Information Technology, university programs, distance education,
                online education, and professional disciplines.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                Through verified institutional relationships, we provide guidance on
                courses from diploma to post-graduation level. Our mission is to
                empower every student with knowledge, skills, and values for a
                successful career.
              </p>
              <Link
                href="/courses"
                className="inline-flex px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                View All Courses
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Image
                src="/images/campus-1.jpg"
                alt="Computer Lab"
                width={300}
                height={200}
                className="rounded-xl object-cover w-full h-48"
              />
              <Image
                src="/images/campus-2.jpg"
                alt="Library"
                width={300}
                height={200}
                className="rounded-xl object-cover w-full h-48 mt-8"
              />
              <Image
                src="/images/campus-3.jpg"
                alt="Classroom"
                width={300}
                height={200}
                className="rounded-xl object-cover w-full h-48 col-span-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              Why Choose AIIT
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything You Need for a Great Career
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white p-6 rounded-xl border border-border hover:shadow-md transition-shadow"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Universities */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              Partner Universities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Verified University Relationships
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {universities.map((u) => (
              <div
                key={u.short}
                className="bg-background p-8 rounded-xl border border-border text-center hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-lg">
                    {u.short}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {u.name}
                </h3>
                <p className="text-sm text-muted">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admission Process */}
      <section className="py-16 md:py-24 bg-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">
              Simple Process
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              How to Get Admitted
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {admissionSteps.map((s) => (
              <div
                key={s.step}
                className="bg-white/5 border border-white/10 p-6 rounded-xl"
              >
                <span className="text-3xl font-bold text-primary-light">
                  {s.step}
                </span>
                <h3 className="text-lg font-semibold mt-3 mb-2">{s.title}</h3>
                <p className="text-sm text-blue-200">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/admission"
              className="inline-flex px-8 py-3 bg-white text-primary-dark font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Start Your Application →
            </Link>
          </div>
        </div>
      </section>

      {/* Study Modes */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              Flexible Learning
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Study Modes Available
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {availableModes.map(title => ({ title, icon: "📚", desc: "Available for verified programs shown in our catalogue" })).map((m) => (
              <div
                key={m.title}
                className="bg-white p-6 rounded-xl border border-border text-center"
              >
                <span className="text-4xl">{m.icon}</span>
                <h3 className="text-lg font-semibold mt-3">{m.title}</h3>
                <p className="text-sm text-muted mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-background rounded-xl border border-border"
              >
                <summary className="px-6 py-4 cursor-pointer font-medium text-foreground list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-muted group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm text-muted leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Applications are open for 2026-27. Secure your admission today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/admission"
              className="px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/vacancies"
              className="px-8 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              View Vacancies
            </Link>
          </div>
        </div>
      </section>


      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${SITE.url}/#faq`,
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }}
      />

      <Footer />
    </>
  );
}
