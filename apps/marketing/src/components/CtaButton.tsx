"use client";

import Link from "next/link";

const appLoginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://default.localhost:3000"}/login`;

type CtaButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "accent";
};

export function CtaButton({ children, className = "", href = appLoginUrl, variant = "primary" }: CtaButtonProps) {
  const variantClass =
    variant === "accent"
      ? "bg-accent hover:bg-accent-deep focus-visible:outline-accent"
      : "bg-brand hover:bg-brand-dark focus-visible:outline-brand";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md px-5 py-2.5 text-small font-semibold text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variantClass} ${className}`}
    >
      {children}
    </Link>
  );
}
