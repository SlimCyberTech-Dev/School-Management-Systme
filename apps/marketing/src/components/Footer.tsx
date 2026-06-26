import Link from "next/link";
import { BRAND } from "@uganda-cbc-sms/brand";
import { Container } from "./Container";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-neutral-50 dark:bg-neutral-950">
      <Container className="py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link href="/" className="flex items-center gap-2.5 font-display text-heading-3 font-bold text-foreground">
              <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-brand-light ring-1 ring-brand/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={BRAND.logoIcon} alt={`${BRAND.productName} logo`} className="h-full w-full object-cover" />
              </span>
              {BRAND.productName}
            </Link>
            <p className="mt-4 max-w-xs text-small text-muted-foreground">{BRAND.companyTagline}</p>
            <p className="mt-2 max-w-xs text-small text-muted-foreground">
              School management for Ugandan secondary schools — O-Level CBC and A-Level UNEB.
            </p>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <p className="text-caption uppercase text-muted-foreground">Explore</p>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label="Footer">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-small text-foreground/80 transition-colors hover:text-brand"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-2">
            <p className="text-caption uppercase text-muted-foreground">Legal</p>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label="Legal">
              {legalLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-small text-foreground/80 transition-colors hover:text-brand"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-small text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {BRAND.companyName}. All rights reserved.
          </p>
          <p>
            Built by <span className="font-medium text-foreground">{BRAND.companyName}</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
