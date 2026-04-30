import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileBarChart2,
  GraduationCap,
  Home,
  Receipt,
  School,
  Users,
} from "lucide-react";
import type { RoleKey, RoleShellConfig } from "./types";

const PRODUCT_LABEL = "Uganda CBC SMS";

export const SHELL_NAV_CONFIG: Record<RoleKey, RoleShellConfig> = {
  admin: {
    role: "admin",
    roleLabel: "Admin",
    productLabel: PRODUCT_LABEL,
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: Home },
      { href: "/admin/students", label: "Students", icon: Users, activePrefix: "/admin/students" },
      { href: "/admin/academic", label: "Academic", icon: BookOpen, activePrefix: "/admin/academic" },
      { href: "/admin/assessment/cbc", label: "Assessment", icon: ClipboardCheck, activePrefix: "/admin/assessment" },
      { href: "/admin/reports", label: "Reports", icon: FileBarChart2, activePrefix: "/admin/reports" },
      { href: "/admin/fees/overview", label: "Fees", icon: CreditCard, activePrefix: "/admin/fees" },
      { href: "/admin/users", label: "Users", icon: GraduationCap, activePrefix: "/admin/users" },
    ],
  },
  headteacher: {
    role: "headteacher",
    roleLabel: "Headteacher",
    productLabel: PRODUCT_LABEL,
    items: [
      { href: "/headteacher/dashboard", label: "Dashboard", icon: Home },
      {
        href: "/headteacher/students",
        label: "Students",
        icon: Users,
        activePrefix: "/headteacher/students",
      },
      {
        href: "/headteacher/academic",
        label: "Academic",
        icon: BookOpen,
        activePrefix: "/headteacher/academic",
      },
      {
        href: "/headteacher/assessment/cbc",
        label: "Assessments",
        icon: ClipboardCheck,
        activePrefix: "/headteacher/assessment",
      },
      {
        href: "/headteacher/reports",
        label: "Report Cards",
        icon: FileBarChart2,
        activePrefix: "/headteacher/reports",
      },
      {
        href: "/headteacher/analytics",
        label: "Analytics",
        icon: BarChart3,
        activePrefix: "/headteacher/analytics",
      },
    ],
  },
  "class-teacher": {
    role: "class-teacher",
    roleLabel: "Class teacher",
    productLabel: PRODUCT_LABEL,
    items: [
      { href: "/class-teacher/dashboard", label: "Dashboard", icon: Home },
      {
        href: "/class-teacher/students",
        label: "My Class",
        icon: School,
        activePrefix: "/class-teacher/students",
      },
      {
        href: "/class-teacher/attendance",
        label: "Attendance",
        icon: ClipboardCheck,
        activePrefix: "/class-teacher/attendance",
      },
      {
        href: "/class-teacher/comments",
        label: "Comments",
        icon: FileBarChart2,
        activePrefix: "/class-teacher/comments",
      },
    ],
  },
  "subject-teacher": {
    role: "subject-teacher",
    roleLabel: "Subject teacher",
    productLabel: PRODUCT_LABEL,
    items: [
      { href: "/subject-teacher/dashboard", label: "Dashboard", icon: Home },
      {
        href: "/subject-teacher/assessment/cbc",
        label: "CBC Assessment",
        icon: ClipboardCheck,
        activePrefix: "/subject-teacher/assessment/cbc",
      },
      {
        href: "/subject-teacher/assessment/alevel",
        label: "A-Level Assessment",
        icon: BookOpen,
        activePrefix: "/subject-teacher/assessment/alevel",
      },
    ],
  },
  bursar: {
    role: "bursar",
    roleLabel: "Bursar",
    productLabel: PRODUCT_LABEL,
    items: [
      { href: "/bursar/dashboard", label: "Dashboard", icon: Home },
      { href: "/bursar/fees", label: "Fee Overview", icon: CreditCard, exactMatch: true },
      {
        href: "/bursar/fees/invoices",
        label: "Invoices",
        icon: Receipt,
        activePrefix: "/bursar/fees/invoices",
      },
      {
        href: "/bursar/fees/payments",
        label: "Record Payment",
        icon: CreditCard,
        activePrefix: "/bursar/fees/payments",
      },
      {
        href: "/bursar/fees/reports",
        label: "Financial Reports",
        icon: FileBarChart2,
        activePrefix: "/bursar/fees/reports",
      },
    ],
  },
};
