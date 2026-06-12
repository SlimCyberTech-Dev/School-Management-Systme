"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/bursar/fees", label: "Collections hub", exact: true },
  { href: "/bursar/fees/invoices", label: "Invoices & billing" },
  { href: "/bursar/fees/payments", label: "Record payment" },
  { href: "/bursar/fees/payments/history", label: "Payment history" },
  { href: "/bursar/fees/schedules", label: "Fee schedules" },
  { href: "/bursar/fees/reports", label: "Reports" },
];

export function BursarFeesSubNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-ui ${
              active
                ? "bg-brand text-white"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
