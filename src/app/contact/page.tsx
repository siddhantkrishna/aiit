import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="bg-primary-dark text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-blue-200">
              Get in touch with AIIT College for admission inquiries and support
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Reach Us</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📍</span>
                      <div>
                        <p className="font-medium text-foreground">Address</p>
                        <p className="text-sm text-muted">AIIT College, Gharghoda, Chhattisgarh</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📞</span>
                      <div>
                        <p className="font-medium text-foreground">Phone</p>
                        <p className="text-sm text-muted">+91 97700 55880</p>
                        <p className="text-sm text-muted">+91 70009 87194</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">💬</span>
                      <div>
                        <p className="font-medium text-foreground">WhatsApp</p>
                        <p className="text-sm text-muted">+91 97700 55880</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">✉️</span>
                      <div>
                        <p className="font-medium text-foreground">Email</p>
                        <p className="text-sm text-muted">info@aiitcollege.edu.in</p>
                        <p className="text-sm text-muted">admission@aiitcollege.edu.in</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Office Hours</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Monday - Saturday</span>
                      <span className="font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Sunday</span>
                      <span className="font-medium">Closed</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps?q=AIIT+College+Gharghoda&output=embed"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-primary text-white rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-4">Admission Helpline</h2>
                  <p className="text-blue-100 text-sm mb-4">
                    Need help with your admission? Our team is here to assist you with course selection, eligibility, and application process.
                  </p>
                  <div className="space-y-3">
                    <a href="tel:+919770055880" className="flex items-center gap-3 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                      <span>📞</span>
                      <div>
                        <p className="font-medium text-sm">Call Now</p>
                        <p className="text-xs text-blue-200">+91 97700 55880</p>
                      </div>
                    </a>
                    <a href="tel:+917000987194" className="flex items-center gap-3 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                      <span>📞</span>
                      <div>
                        <p className="font-medium text-sm">Call Now</p>
                        <p className="text-xs text-blue-200">+91 70009 87194</p>
                      </div>
                    </a>
                    <a href="https://wa.me/919770055880" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                      <span>💬</span>
                      <div>
                        <p className="font-medium text-sm">WhatsApp</p>
                        <p className="text-xs text-blue-200">Chat with us</p>
                      </div>
                    </a>
                    <a href="mailto:admission@aiitcollege.edu.in" className="flex items-center gap-3 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                      <span>✉️</span>
                      <div>
                        <p className="font-medium text-sm">Email</p>
                        <p className="text-xs text-blue-200">admission@aiitcollege.edu.in</p>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border p-6 text-center">
                  <h2 className="text-lg font-bold text-foreground mb-2">Apply for Admission</h2>
                  <p className="text-sm text-muted mb-4">Start your application online. No registration required.</p>
                  <a href="/admission" className="inline-block px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors">Apply Now →</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}