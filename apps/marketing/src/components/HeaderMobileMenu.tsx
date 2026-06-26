"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { CtaButton } from "./CtaButton";

type NavLink = { href: string; label: string };

type HeaderMobileMenuProps = {
  links: readonly NavLink[];
};

export function HeaderMobileMenu({ links }: HeaderMobileMenuProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen, close]);

  return (
    <>
      <ThemeToggle />
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted md:hidden"
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div
        id="mobile-nav"
        className={`fixed inset-x-0 top-16 z-50 border-t border-border bg-background/95 backdrop-blur-md transition-all duration-300 ease-smooth md:hidden ${
          mobileOpen ? "visible max-h-[calc(100vh-4rem)] opacity-100" : "invisible max-h-0 opacity-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <nav
          className={`mx-auto flex w-full max-w-content flex-col gap-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 ${
            mobileOpen ? "animate-slide-down" : ""
          }`}
          aria-label="Mobile"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              tabIndex={mobileOpen ? 0 : -1}
              className="rounded-md px-3 py-3 text-body font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted"
              onClick={close}
            >
              {label}
            </Link>
          ))}
          <div className="mt-3 border-t border-border pt-4">
            <CtaButton className="w-full">Get Started</CtaButton>
          </div>
        </nav>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 top-16 z-40 bg-foreground/20 md:hidden"
          aria-label="Close menu overlay"
          onClick={close}
        />
      ) : null}
    </>
  );
}
