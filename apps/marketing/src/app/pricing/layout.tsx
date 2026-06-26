import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Flexible SchoolManage plans for single schools and multi-campus groups. Starter, Growing, and Multi-Campus tiers quoted to your enrolment and modules.",
  path: "/pricing",
  noIndex: true,
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
