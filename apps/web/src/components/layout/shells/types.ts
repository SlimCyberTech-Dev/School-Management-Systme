import type { LucideIcon } from "lucide-react";

export type RoleKey = "admin" | "headteacher" | "class-teacher" | "subject-teacher" | "bursar";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  activePrefix?: string;
  exactMatch?: boolean;
};

export type RoleShellConfig = {
  role: RoleKey;
  roleLabel: string;
  productLabel: string;
  items: NavItem[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  helper?: string;
};
