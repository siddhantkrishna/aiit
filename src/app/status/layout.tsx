import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Application Status | AIIT College",
  description:
    "Check your AIIT College admission application status using your application number or registered mobile number.",
  pathname: "/status",
  index: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
