import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Apply for Vacancy | AIIT College",
  description: "Apply for an open position at AIIT College.",
  pathname: "/vacancies/apply",
  index: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
