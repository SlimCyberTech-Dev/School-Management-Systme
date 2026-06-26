import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Answers about SchoolManage: O-Level CBC assessment, A-Level UNEB grading, fees, security, parent portal, and getting started.",
  path: "/faq",
  noIndex: true,
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
