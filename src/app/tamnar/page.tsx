import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TamnarPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <section className="bg-primary-dark text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              AIIT College / एआईआईटी कॉलेज
            </p>

            <h1 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">
              AIIT College
              <span className="block text-blue-300">Tamnar</span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Tamnar Branch / तमनार शाखा
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100 md:text-base">
              Explore AIIT College courses, admissions, education and career
              guidance for students in Tamnar and surrounding areas.
              <br />
              <span className="mt-2 block">
                तमनार और आसपास के विद्यार्थियों के लिए AIIT College के
                पाठ्यक्रम, प्रवेश, शिक्षा और करियर मार्गदर्शन की जानकारी
                प्राप्त करें।
              </span>
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tamnar/inquiry"
                className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-primary-dark transition hover:bg-blue-50"
              >
                Career Inquiry / करियर पूछताछ →
              </Link>

              <Link
                href="/admission"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Admission / प्रवेश
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="text-3xl font-black text-primary">01</div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                Courses / पाठ्यक्रम
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Explore available computer education and professional courses.
                <br />
                <span className="mt-2 block">
                  उपलब्ध कंप्यूटर शिक्षा और प्रोफेशनल पाठ्यक्रम देखें।
                </span>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="text-3xl font-black text-primary">02</div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                Admissions / प्रवेश
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Get information about eligibility and admission procedures.
                <br />
                <span className="mt-2 block">
                  पात्रता और प्रवेश प्रक्रिया की जानकारी प्राप्त करें।
                </span>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="text-3xl font-black text-primary">03</div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                Career Guidance / करियर मार्गदर्शन
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Speak with the AIIT team about education and career options.
                <br />
                <span className="mt-2 block">
                  शिक्षा और करियर विकल्पों के लिए AIIT टीम से संपर्क करें।
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Tamnar Branch / तमनार शाखा
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Information for Tamnar Students
                <br />
                तमनार के विद्यार्थियों के लिए जानकारी
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                This page is ready for your Tamnar-specific address, phone
                number, courses, timings, photographs and other details.
                <br />
                <span className="mt-2 block">
                  इस पेज पर तमनार शाखा का पता, फोन नंबर, पाठ्यक्रम, समय, फोटो
                  और अन्य जानकारी बाद में जोड़ी जा सकती है।
                </span>
              </p>

              <Link
                href="/tamnar/inquiry"
                className="mt-7 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
              >
                Ask AIIT / AIIT से पूछें →
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 text-center md:px-6 md:py-16 lg:px-8">
            <h2 className="text-3xl font-black md:text-4xl">
              Need career guidance?
              <br />
              करियर मार्गदर्शन चाहिए?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Send your details and our team can help you understand your
              education and admission options.
              <br />
              अपनी जानकारी भेजें और हमारी टीम से शिक्षा एवं प्रवेश विकल्पों
              के बारे में मार्गदर्शन प्राप्त करें।
            </p>

            <Link
              href="/tamnar/inquiry"
              className="mt-7 inline-flex rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              Tamnar Inquiry / तमनार पूछताछ →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
