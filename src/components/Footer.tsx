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
          {/* Brand */}
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

          {/* Quick Links */}
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

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm text-blue-200">
              <p>📍 AIIT College Campus, Main Road</p>
              <p>📞 +91 98765 43210</p>
              <p>📞 +91 98765 43211</p>
              <p>💬 WhatsApp: +91 98765 43210</p>
              <p>✉️ info@aiitcollege.edu.in</p>
              <p>✉️ admission@aiitcollege.edu.in</p>
            </div>
          </div>

          {/* Map */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Location</h3>
            <div className="rounded-lg overflow-hidden bg-blue-900/50 h-40 flex items-center justify-center text-sm text-blue-300">
              <div className="text-center p-4">
                <p className="text-2xl mb-2">🗺️</p>
                <p>AIIT College Campus</p>
                <p className="text-xs mt-1">View on Google Maps</p>
              </div>
            </div>
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
