import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online Exams | AIIT College",
  description:
    "AIIT College online examination portal.",
  pathname: "/online-exams",
  index: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
