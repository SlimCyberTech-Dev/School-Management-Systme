import Link from "next/link";
import { BRAND } from "@uganda-cbc-sms/brand";
import { Container } from "./Container";
import { HeaderMobileMenu } from "./HeaderMobileMenu";
import { CtaButton } from "./CtaButton";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/#roles", label: "Roles" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function Header() {
  return (
    <header className="sticky top-1 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 font-display text-heading-3 font-bold text-foreground"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-light ring-1 ring-brand/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.logoIcon} alt={`${BRAND.productName} logo`} className="h-full w-full object-cover" />
          </span>
          <span className="truncate">{BRAND.productName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-small font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <CtaButton className="hidden sm:inline-flex">Get Started</CtaButton>
          <HeaderMobileMenu links={navLinks} />
        </div>
      </Container>
    </header>
  );
}
