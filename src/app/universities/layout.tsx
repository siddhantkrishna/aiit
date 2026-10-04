import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Partner Universities | AIIT College Gharghoda",
  description:
    "Explore the universities and higher-education programs available through AIIT College in Gharghoda, Raigarh, Chhattisgarh.",
  pathname: "/universities",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
