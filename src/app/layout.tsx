import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIIT College - Aryabhatta Institute of Information Technology",
  description:
    "AIIT College offers quality computer education, university programs, distance education, online education, skill development, and professional courses. Apply for admission today.",
  keywords:
    "AIIT College, Aryabhatta Institute, Computer Education, BCA, MCA, DCA, PGDCA, Distance Education, Online Education, Admission",
  openGraph: {
    title: "AIIT College - Aryabhatta Institute of Information Technology",
    description:
      "Quality education for a brighter future. Apply for admission to AIIT College.",
    type: "website",
    locale: "en_IN",
    siteName: "AIIT College",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/aiit-logo.png" />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
