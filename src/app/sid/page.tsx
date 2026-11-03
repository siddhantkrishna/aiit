import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/seo";

const pageUrl = SITE.url + "/sid";
const personalUrl = "https://www.siddhantkrishna.com";
const profileLinks = [
  { name: "Website", handle: "siddhantkrishna.com", url: personalUrl },
  { name: "LinkedIn", handle: "siddhantkrishnaa", url: "https://www.linkedin.com/in/siddhantkrishnaa" },
  { name: "GitHub", handle: "@siddhantkrishna", url: "https://github.com/siddhantkrishna" },
  { name: "X / Twitter", handle: "@SidhantKrishna", url: "https://x.com/SidhantKrishna" },
  { name: "Instagram", handle: "@siddhantkrishnaa", url: "https://www.instagram.com/siddhantkrishnaa/" },
];
const ventures = [
  { name: "Spark Labs", role: "Founder & CEO", url: personalUrl + "/projects" },
  { name: "Charvikon", role: "Founder", url: "https://www.charvikon.com" },
  { name: "VOGON", role: "Founder", url: "https://www.vogon.in" },
  { name: "Mesosphere", role: "Founder", url: "https://mesosphere.in" },
];
const tags = [
  "ArtificialIntelligence", "Entrepreneurship", "Robotics", "DefenceTechnology",
  "AutonomousAgents", "Engineering", "FutureOfEducation", "FirstPrinciples",
];
const description = "Siddhant Krishna is Strategic Advisor at AIIT College and the founder and CEO of Spark Labs. Explore his biography, ventures in AI, education and engineering, and official profiles.";

export const metadata: Metadata = {
  title: "Siddhant Krishna | Strategic Advisor, AIIT College",
  description,
  keywords: [
    "Siddhant Krishna", "Siddhant Krishna AIIT College", "Strategic Advisor AIIT College",
    "Siddhant Krishna biography", "Spark Labs founder", "Charvikon founder",
    "VOGON founder", "Mesosphere founder", "AI entrepreneur India",
    "AI education Raigarh", "artificial intelligence", "defence technology",
  ],
  alternates: { canonical: pageUrl },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "profile",
    url: pageUrl,
    siteName: SITE.name,
    locale: "en_IN",
    title: "Siddhant Krishna — Strategic Advisor, AIIT College",
    description,
  },
  twitter: {
    card: "summary",
    title: "Siddhant Krishna — Strategic Advisor, AIIT College",
    description,
    creator: "@SidhantKrishna",
  },
};

const personId = personalUrl + "/#person";
const personSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": personId,
      name: "Siddhant Krishna",
      url: personalUrl,
      description,
      jobTitle: "Strategic Advisor",
      worksFor: { "@id": SITE.url + "/#organization" },
      affiliation: [
        { "@type": "Organization", name: "Spark Labs" },
        { "@type": "Organization", name: "Charvikon", url: "https://www.charvikon.com" },
        { "@type": "Organization", name: "VOGON", url: "https://www.vogon.in" },
        { "@type": "Organization", name: "Mesosphere", url: "https://mesosphere.in" },
      ],
      knowsAbout: [
        "Artificial intelligence", "AI agents", "Robotics", "Software engineering",
        "Defence technology", "Entrepreneurship", "Technology education",
      ],
      sameAs: profileLinks.map((profile) => profile.url),
    },
    {
      "@type": "ProfilePage",
      "@id": pageUrl + "#profile",
      url: pageUrl,
      name: "Siddhant Krishna — Strategic Advisor at AIIT College",
      description,
      inLanguage: "en-IN",
      isPartOf: { "@id": SITE.url + "/#website" },
      mainEntity: { "@id": personId },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "AIIT College", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Siddhant Krishna", item: pageUrl },
      ],
    },
  ],
};

export default function SidPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <JsonLd data={personSchema} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="AIIT College home">
            <Image src="/images/aiit-logo.png" alt="" width={42} height={42} className="rounded-full" />
            <div>
              <span className="block text-sm font-bold tracking-tight text-[#0B1F4B]">AIIT College</span>
              <span className="block text-[11px] text-slate-500">Aryabhatta Institute of Information Technology</span>
            </div>
          </Link>
          <Link href="/" className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 sm:text-sm">
            <ArrowLeft size={16} aria-hidden="true" /> Back to college
          </Link>
        </div>
      </header>

      <main>
        <section className="overflow-hidden border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,.7fr)] lg:items-end">
            <div>
              <p className="mb-8 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">AIIT College / Strategic Advisor</p>
              <h1 className="text-5xl font-semibold tracking-[-0.055em] text-[#0B1F4B] sm:text-7xl lg:text-[5.6rem] lg:leading-[1.04]">
                Siddhant<br />Krishna<span className="text-blue-600">.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                Entrepreneur, founder and builder working across artificial intelligence, education, engineering and advanced technology.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={personalUrl} target="_blank" rel="noopener noreferrer me" className="inline-flex items-center gap-2 rounded-md bg-[#0B1F4B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800">
                  Personal website <ArrowUpRight size={16} aria-hidden="true" />
                </a>
                <a href="https://www.linkedin.com/in/siddhantkrishnaa" target="_blank" rel="noopener noreferrer me" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-600 hover:text-blue-700">
                  LinkedIn <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="relative flex aspect-[1.32] items-end justify-between overflow-hidden rounded-lg bg-[#0B1F4B] p-7 text-white sm:p-9 lg:aspect-[.98]">
              <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" aria-hidden="true" />
              <div className="absolute -right-7 -top-8 h-52 w-52 rounded-full border border-white/10" aria-hidden="true" />
              <span className="relative text-7xl font-semibold tracking-[-0.1em] text-white/90 sm:text-8xl">SK</span>
              <span className="relative text-right text-[10px] font-medium uppercase leading-relaxed tracking-[0.2em] text-blue-200">Ideas into<br />working systems</span>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,.75fr)] lg:gap-20">
          <article aria-labelledby="bio-heading">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">Profile / 01</p>
            <h2 id="bio-heading" className="mb-9 text-3xl font-semibold tracking-tight text-[#0B1F4B] sm:text-4xl">Biography</h2>
            <div className="space-y-6 text-[15px] leading-[1.9] text-slate-700 sm:text-base">
              <p>Siddhant Krishna is an entrepreneur and the founder and CEO of <strong className="font-semibold text-slate-900">Spark Labs</strong>, an artificial intelligence learning laboratory focused on developing the next generation of builders, engineers, and entrepreneurs. His work focuses on building companies, developing intelligent technologies, and creating institutions that challenge conventional approaches to education and innovation.</p>
              <p>He is the founder of <strong className="font-semibold text-slate-900">Charvikon</strong>, a technology, training, and research organization working toward a new model of technical education built around experimentation, engineering, and first-principles thinking. Through <strong className="font-semibold text-slate-900">Spark Labs</strong>, he is developing practical, project-based programs that enable young people to move beyond consuming technology and begin creating software, AI-powered products, and real-world solutions.</p>
              <p>Beyond education, Siddhant founded <strong className="font-semibold text-slate-900">VOGON</strong>, a defence technology venture focused on intelligent systems, autonomous software, and advanced engineering. He is also building <strong className="font-semibold text-slate-900">Mesosphere</strong>, a founder residency designed to bring ambitious young entrepreneurs together to turn early ideas into companies through intensive building, collaboration, and execution.</p>
              <p>His interests span artificial intelligence, autonomous agents, robotics, software engineering, defence technology, product development, and the creation of new companies. Across his ventures, he approaches problems through first-principles reasoning, with an emphasis on reducing complexity, questioning established assumptions, and translating ambitious ideas into working systems.</p>
              <p>Siddhant believes that advances in artificial intelligence will fundamentally change how people learn, work, invent, and build businesses. He sees education not simply as the transfer of knowledge, but as a means of developing independent thinkers capable of understanding difficult problems and creating original solutions.</p>
              <p>His long-term ambition is to build enduring technology companies and research-driven institutions that advance engineering, expand access to technical capabilities, and contribute to scientific and technological progress.</p>
              <p className="border-l-2 border-blue-600 pl-5 text-lg font-medium leading-relaxed text-[#0B1F4B]">At the center of his work is a straightforward conviction: the most meaningful way to shape the future is to build it.</p>
            </div>
            <section aria-labelledby="fields-heading" className="mt-14 border-t border-slate-200 pt-9">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">Areas of interest / 02</p>
              <h2 id="fields-heading" className="mb-5 text-2xl font-semibold tracking-tight text-[#0B1F4B]">Fields of work</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => <span key={tag} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">#{tag}</span>)}
              </div>
            </section>
          </article>

          <aside className="space-y-12 lg:pt-2" aria-label="Professional details and official links">
            <section>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">Current role</p>
              <div className="border-t-2 border-[#0B1F4B] pt-5">
                <h2 className="text-xl font-semibold text-[#0B1F4B]">Strategic Advisor</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">AIIT College — Aryabhatta Institute of Information Technology</p>
                <p className="mt-3 text-xs text-slate-500">Gharghoda, Raigarh, Chhattisgarh, India</p>
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">Ventures</h2>
              <div className="border-t border-slate-200">
                {ventures.map((venture) => (
                  <a key={venture.name} href={venture.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-4 border-b border-slate-200 py-3.5 transition-colors hover:text-blue-700">
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{venture.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{venture.role}</span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-blue-600" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">Official profiles</h2>
              <div className="border-t border-slate-200">
                {profileLinks.map((profile) => (
                  <a key={profile.name} href={profile.url} target="_blank" rel="noopener noreferrer me" className="group flex items-center justify-between gap-4 border-b border-slate-200 py-3.5 transition-colors hover:text-blue-700">
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{profile.name}</span>
                      <span className="mt-1 block break-all text-xs text-slate-500">{profile.handle}</span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-blue-600" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>AIIT College · Strategic Advisor profile</p>
          <Link href="/" className="font-medium text-blue-700 hover:underline">Return to AIIT College</Link>
        </div>
      </footer>
    </div>
  );
}
