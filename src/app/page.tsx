import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: "🎓",
    title: "University Programs",
    desc: "Affiliated with top universities like CVRU, AISECT & RNTU",
  },
  {
    icon: "💻",
    title: "Computer Education",
    desc: "DCA, PGDCA, Hardware, Typing, Tally & more",
  },
  {
    icon: "📚",
    title: "Distance Education",
    desc: "Study from home with flexible schedules",
  },
  {
    icon: "🏆",
    title: "Skill Development",
    desc: "Industry-ready professional certifications",
  },
  {
    icon: "🌐",
    title: "Online Education",
    desc: "Learn anywhere, anytime with digital resources",
  },
  {
    icon: "📋",
    title: "Career Guidance",
    desc: "Expert counseling for your career path",
  },
];

const universities = [
  {
    name: "Dr. C.V. Raman University",
    short: "CVRU",
    desc: "UGC recognized university offering diverse programs",
  },
  {
    name: "AISECT University",
    short: "AISECT",
    desc: "Leading university in technology and professional education",
  },
  {
    name: "RNTU",
    short: "RNTU",
    desc: "Rabindranath Tagore University for holistic education",
  },
];

const stats = [
  { value: "1000+", label: "Students Enrolled" },
  { value: "50+", label: "Courses Offered" },
  { value: "3+", label: "Partner Universities" },
  { value: "10+", label: "Years of Excellence" },
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
    a: "We offer a wide range of courses including DCA, PGDCA, BCA, MCA, B.Sc, M.Sc, B.Com, M.Com, BA, MA, MBA, B.Ed, D.El.Ed, B.Pharma, D.Pharma, Nursing, Computer Hardware, Typing, Tally, and many more.",
  },
  {
    q: "Which universities are affiliated with AIIT?",
    a: "AIIT College is affiliated with Dr. C.V. Raman University (CVRU), AISECT University, and RNTU (Rabindranath Tagore University).",
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
    a: "Yes, we offer distance education, online education, and private education modes for various courses.",
  },
];

export default function HomePage() {
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
                Admissions Open 2025-26
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Shape Your Future at{" "}
                <span className="text-primary-light">AIIT College</span>
              </h1>
              <p className="text-lg text-blue-200 mb-8 max-w-lg">
                Aryabhatta Institute of Information Technology — Empowering
                students with quality education in Computer Science, Technology,
                and Professional Development.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admission"
                  className="px-6 py-3 bg-white text-primary-dark font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Apply for Admission →
                </Link>
                <Link
                  href="/courses"
                  className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Explore Courses
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
                a premier educational institution dedicated to providing quality
                education in Computer Science, Information Technology, and
                various professional disciplines.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                Affiliated with top universities, we offer a wide range of
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
              Affiliated with Top Universities
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
            {[
              { icon: "🏫", title: "Regular", desc: "Full-time on-campus learning" },
              { icon: "📡", title: "Distance", desc: "Study from anywhere at your pace" },
              { icon: "🌐", title: "Online", desc: "Digital classroom experience" },
              { icon: "📝", title: "Private", desc: "Self-paced private study mode" },
            ].map((m) => (
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
            Applications are open for 2025-26. Secure your admission today.
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
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
