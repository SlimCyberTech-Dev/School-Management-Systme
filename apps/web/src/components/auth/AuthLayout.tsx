"use client";

import { ReactNode } from "react";
import { BrandMark } from "@/components/brand/BrandMark";

type AuthLayoutProps = {
  children: ReactNode;
  supportingCopy?: string;
};

export function AuthLayout({ children, supportingCopy }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 w-full max-w-md text-center">
        <BrandMark subtitle={supportingCopy} size="header" className="items-center text-center" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
