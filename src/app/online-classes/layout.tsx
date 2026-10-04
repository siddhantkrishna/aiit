import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online Classes | AIIT College",
  description:
    "Access online classes and digital learning resources from AIIT College, Gharghoda, Raigarh, Chhattisgarh.",
  pathname: "/online-classes",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
