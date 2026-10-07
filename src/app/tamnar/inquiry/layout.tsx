import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tamnar Inquiry | AIIT College",
  description:
    "Send an inquiry to AIIT College Tamnar for courses, admissions, fees, university programs and career guidance.",
  keywords: [
    "AIIT Tamnar inquiry",
    "AIIT College Tamnar inquiry",
    "Tamnar admission inquiry",
    "career guidance Tamnar",
    "computer course Tamnar",
    "AIIT Tamnar admission",
  ],
  alternates: {
    canonical: "https://aiitcollege.in/tamnar/inquiry",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function TamnarInquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
