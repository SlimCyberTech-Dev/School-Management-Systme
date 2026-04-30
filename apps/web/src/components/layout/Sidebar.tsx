"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@uganda-cbc-sms/shared";
import { useAuthStore } from "@/store/authStore";

type NavItem = { href: string; label: string };

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/students", label: "Students" },
    { href: "/academic", label: "Academic Structure" },
    { href: "/assessment/cbc", label: "CBC Assessment" },
    { href: "/assessment/alevel", label: "A-Level Assessment" },
    { href: "/reports", label: "Reports" },
    { href: "/fees", label: "Fees" },
    { href: "/users", label: "Users" },
  ],
  headteacher: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/students", label: "Students" },
    { href: "/assessment/cbc", label: "CBC Assessment" },
    { href: "/assessment/alevel", label: "A-Level Assessment" },
    { href: "/reports", label: "Reports" },
    { href: "/analytics", label: "Analytics" },
  ],
  class_teacher: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/students", label: "Students" },
    { href: "/assessment/cbc", label: "CBC Assessment" },
    { href: "/assessment/alevel", label: "A-Level Assessment" },
    { href: "/attendance", label: "Attendance" },
  ],
  subject_teacher: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/assessment/cbc", label: "CBC Assessment" },
    { href: "/assessment/alevel", label: "A-Level Assessment" },
  ],
  bursar: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/fees", label: "Fees" },
    { href: "/fees/payments", label: "Payments" },
    { href: "/fees/reports", label: "Financial Reports" },
  ],
};

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const role = (user?.role ?? "subject_teacher") as Role;
  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.subject_teacher;

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="text-lg font-bold text-brand">Uganda CBC SMS</div>
        <p className="text-xs text-slate-500">School Management</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-brand text-white" : "text-slate-700 hover:bg-brand-light"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
