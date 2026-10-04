import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact AIIT College | Gharghoda, Raigarh, Chhattisgarh",
  description:
    "Contact AIIT College, Aryabhatta Institute of Information Technology, in Gharghoda, Raigarh, Chhattisgarh for admissions, courses, university programs, and student support.",
  pathname: "/contact",
  keywords: [
    "AIIT College contact",
    "AIIT College phone number",
    "AIIT College address",
    "AIIT Gharghoda contact",
    "AIIT Raigarh contact",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
