import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Careers & Vacancies | AIIT College Gharghoda",
  description:
    "Explore current teaching, administration, technology, and other career opportunities at AIIT College in Gharghoda, Raigarh, Chhattisgarh.",
  pathname: "/vacancies",
  keywords: [
    "AIIT College jobs",
    "AIIT College careers",
    "jobs in Gharghoda",
    "jobs in Raigarh",
    "education jobs Chhattisgarh",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
