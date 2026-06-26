import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about SchoolManage: CBC, UNEB, fees, security, and getting started.",
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
