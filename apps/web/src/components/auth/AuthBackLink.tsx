import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

type Props = {
  href: string;
  label?: string;
  className?: string;
};

export function AuthBackLink({ href, label = "Back", className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`font-body mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline ${className}`}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function AuthFooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p className="mt-4">
      <Link href={href} className="font-body text-sm font-medium text-brand hover:underline">
        {children}
      </Link>
    </p>
  );
}
