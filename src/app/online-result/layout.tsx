import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online Result | AIIT College",
  description:
    "Secure AIIT College student result portal.",
  pathname: "/online-result",
  index: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
