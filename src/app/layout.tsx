import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import JsonLd from "@/components/JsonLd";
import {
  SITE,
  SITE_KEYWORDS,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),

  title: {
    default: "AIIT College Gharghoda | Aryabhatta Institute of Information Technology",
    template: "%s | AIIT College",
  },

  description: SITE.description,

  keywords: SITE_KEYWORDS,

  authors: [
    {
      name: SITE.fullName,
      url: SITE.url,
    },
  ],

  creator: SITE.name,
  publisher: SITE.name,
  category: "education",

  applicationName: SITE.name,

  alternates: {
    canonical: SITE.url,
    languages: {
      "en-IN": SITE.url,
    },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/images/aiit-logo.png",
    shortcut: "/images/aiit-logo.png",
    apple: "/images/aiit-logo.png",
  },

  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_IN",
    title:
      "AIIT College Gharghoda | Aryabhatta Institute of Information Technology",
    description: SITE.description,
    images: [
      {
        url: `${SITE.url}${SITE.heroImage}`,
        width: 1200,
        height: 630,
        alt: `${SITE.name} in Gharghoda, Raigarh, Chhattisgarh`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "AIIT College Gharghoda | Aryabhatta Institute of Information Technology",
    description: SITE.description,
    images: [`${SITE.url}${SITE.heroImage}`],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en-IN">
      <body className="bg-background text-foreground antialiased">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [organizationJsonLd, websiteJsonLd],
          }}
        />
        {children}
      </body>
    </html>
  );
}
