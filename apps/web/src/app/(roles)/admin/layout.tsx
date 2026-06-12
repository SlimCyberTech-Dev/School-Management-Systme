"use client";

import { AppShell } from "@/components/layout/shells/AppShell";
import { SHELL_NAV_CONFIG } from "@/components/layout/shells/navigation.config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell config={SHELL_NAV_CONFIG.admin}>{children}</AppShell>;
}
