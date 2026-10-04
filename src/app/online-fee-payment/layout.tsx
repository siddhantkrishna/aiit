import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online Fee Payment | AIIT College",
  description:
    "Secure online fee payment portal for AIIT College students.",
  pathname: "/online-fee-payment",
  index: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
