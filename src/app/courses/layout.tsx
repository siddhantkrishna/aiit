import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Courses & Programs in Gharghoda, Raigarh",
  description:
    "Explore computer, technology, university, distance education, online education, medical, and professional courses offered through AIIT College in Gharghoda, Raigarh, Chhattisgarh.",
  pathname: "/courses",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
