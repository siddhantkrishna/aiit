import type { Metadata } from "next";

export const SITE = {
  name: "AIIT College",
  fullName: "Aryabhatta Institute of Information Technology",
  url: "https://aiitcollege.edu.in",
  description:
    "AIIT College is an educational institution in Gharghoda, Raigarh, Chhattisgarh, India, offering computer education, university programs, distance education, online education, skill development, and professional courses.",
  location: "Gharghoda, Raigarh, Chhattisgarh, India",
  locality: "Gharghoda",
  district: "Raigarh",
  region: "Chhattisgarh",
  country: "India",
  countryCode: "IN",
  postalCode: "496111",
  phone: "+91 97700 55880",
  alternatePhone: "+91 70009 87194",
  whatsapp: "+91 97700 55880",
  email: "info@aiitcollege.edu.in",
  admissionsEmail: "admission@aiitcollege.edu.in",
  logo: "/images/aiit-logo.png",
  heroImage: "/images/hero-bg.jpg",
  mapUrl: "https://maps.app.goo.gl/2XwJPmpcnshehBYY9",
};

export const SITE_KEYWORDS = [
  "AIIT College",
  "Aryabhatta Institute of Information Technology",
  "AIIT College Gharghoda",
  "AIIT College Raigarh",
  "AIIT College Chhattisgarh",
  "AIIT Gharghoda",
  "AIIT Raigarh",
  "college in Gharghoda",
  "college in Raigarh",
  "college in Chhattisgarh",
  "computer education Gharghoda",
  "computer education Raigarh",
  "computer education Chhattisgarh",
  "computer courses Gharghoda",
  "computer courses Raigarh",
  "computer courses Chhattisgarh",
  "BCA Gharghoda",
  "MCA Gharghoda",
  "DCA Gharghoda",
  "PGDCA Gharghoda",
  "BCA Raigarh",
  "MCA Raigarh",
  "DCA Raigarh",
  "PGDCA Raigarh",
  "distance education Raigarh",
  "online education Raigarh",
  "skill development Raigarh",
  "professional courses Raigarh",
  "university programs Raigarh",
  "admission Gharghoda",
  "college admission Raigarh",
  "college admission Chhattisgarh"
];

export function pageMetadata({
  title,
  description,
  pathname,
  keywords = [],
  index = true,
}: {
  title: string;
  description: string;
  pathname: string;
  keywords?: string[];
  index?: boolean;
}): Metadata {
  const canonical = `${SITE.url}${pathname === "/" ? "" : pathname}`;

  return {
    title,
    description,
    keywords: [...new Set([...SITE_KEYWORDS, ...keywords])],
    alternates: {
      canonical,
      languages: {
        "en-IN": canonical,
      },
    },
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE.name,
      locale: "en_IN",
      title,
      description,
      images: [
        {
          url: `${SITE.url}${SITE.heroImage}`,
          width: 1200,
          height: 630,
          alt: `${SITE.name} — ${SITE.fullName}, Gharghoda, Raigarh, Chhattisgarh`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE.url}${SITE.heroImage}`],
    },
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  alternateName: [
    SITE.fullName,
    "AIIT",
    "AIIT College Gharghoda",
    "Aryabhatta Institute"
  ],
  url: SITE.url,
  logo: `${SITE.url}${SITE.logo}`,
  image: `${SITE.url}${SITE.heroImage}`,
  description: SITE.description,
  telephone: SITE.phone,
  email: `mailto:${SITE.email}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "AIIT College",
    addressLocality: SITE.locality,
    addressRegion: SITE.region,
    postalCode: SITE.postalCode,
    addressCountry: SITE.countryCode,
  },
  areaServed: [
    {
      "@type": "Place",
      name: "Gharghoda",
    },
    {
      "@type": "AdministrativeArea",
      name: "Raigarh",
    },
    {
      "@type": "AdministrativeArea",
      name: "Chhattisgarh",
    },
    {
      "@type": "Country",
      name: "India",
    },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      contactType: "admissions",
      email: SITE.admissionsEmail,
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    {
      "@type": "ContactPoint",
      telephone: SITE.alternatePhone,
      contactType: "customer support",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
  ],
  knowsAbout: [
    "Computer Science",
    "Information Technology",
    "Computer Education",
    "BCA",
    "MCA",
    "DCA",
    "PGDCA",
    "Distance Education",
    "Online Education",
    "Skill Development",
    "Professional Education",
    "Career Guidance",
    "Technology Education",
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  name: SITE.name,
  alternateName: SITE.fullName,
  url: SITE.url,
  description: SITE.description,
  publisher: {
    "@id": `${SITE.url}/#organization`,
  },
  inLanguage: "en-IN",
};
