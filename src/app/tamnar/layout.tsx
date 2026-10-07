import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIIT College Tamnar | Aryabhatta Institute of Information Technology",
  description:
    "AIIT College Tamnar branch information, courses, admissions and career guidance for students in Tamnar and surrounding areas.",
  keywords: [
    "AIIT College Tamnar",
    "AIIT Tamnar",
    "AIIT College Tamnar Chhattisgarh",
    "college in Tamnar",
    "computer courses Tamnar",
    "computer education Tamnar",
    "admission Tamnar",
    "career guidance Tamnar",
  ],
  alternates: {
    canonical: "https://aiitcollege.in/tamnar",
  },
};

export default function TamnarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
