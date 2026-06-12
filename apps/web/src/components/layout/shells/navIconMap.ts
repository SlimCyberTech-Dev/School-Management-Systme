import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardCheck,
  CreditCard,
  FileBarChart2,
  FileText,
  GraduationCap,
  Home,
  Receipt,
  School,
  Shield,
  Users,
} from "lucide-react";
import type { NavIconId } from "./types";

export const NAV_ICON_MAP: Record<NavIconId, LucideIcon> = {
  home: Home,
  users: Users,
  bookOpen: BookOpen,
  calendar: Calendar,
  clipboardCheck: ClipboardCheck,
  fileBarChart2: FileBarChart2,
  fileText: FileText,
  creditCard: CreditCard,
  graduationCap: GraduationCap,
  barChart3: BarChart3,
  school: School,
  receipt: Receipt,
  shield: Shield,
};
