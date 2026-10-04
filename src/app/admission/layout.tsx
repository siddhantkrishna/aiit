import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Admission 2026–27 | AIIT College Gharghoda",
  description:
    "Apply for admission to AIIT College in Gharghoda, Raigarh, Chhattisgarh. Explore courses, eligibility, university programs, and online admission.",
  pathname: "/admission",
  keywords: [
    "AIIT College admission",
    "AIIT Gharghoda admission",
    "admission 2026",
    "admission 2026-27",
    "college admission Gharghoda",
    "college admission Raigarh",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
