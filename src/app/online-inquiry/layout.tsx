import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online Inquiry | AIIT College",
  description:
    "Send an admission or course inquiry to AIIT College in Gharghoda, Raigarh, Chhattisgarh.",
  pathname: "/online-inquiry",
  index: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
