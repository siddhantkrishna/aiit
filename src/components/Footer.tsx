import Image from "next/image";
import Link from "next/link";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/universities", label: "Universities" },
  { href: "/admission", label: "Apply Now" },
  { href: "/status", label: "Check Status" },
  { href: "/contact", label: "Contact Us" },
];

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/aiit-logo.png"
                alt="AIIT College"
                width={48}
                height={48}
                className="rounded-full bg-white p-0.5"
              />
              <div>
                <p className="font-bold text-lg">AIIT College</p>
                <p className="text-xs text-blue-200">
                  Aryabhatta Institute of Information Technology
                </p>
              </div>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed">
              Empowering students with quality education in Computer Science,
              Technology, and Professional Development since establishment.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm text-blue-200">
              <p>📍 AIIT College, Gharghoda, Chhattisgarh</p>
              <p>📞 +91 97700 55880</p>
              <p>📞 +91 70009 87194</p>
              <p>💬 WhatsApp: +91 97700 55880</p>
              <p>✉️ info@aiitcollege.edu.in</p>
              <p>✉️ admission@aiitcollege.edu.in</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Location</h3>
            <a
              href="https://maps.app.goo.gl/2XwJPmpcnshehBYY9"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden"
            >
              <iframe
                src="https://www.google.com/maps?q=AIIT+College+Gharghoda&output=embed"
                width="100%"
                height="160"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-blue-300">
              © {new Date().getFullYear()} AIIT College. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-blue-300">
              <Link href="/admin/login" className="hover:text-white">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}