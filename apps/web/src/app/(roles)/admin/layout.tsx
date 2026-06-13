"use client";

import { AppShell } from "@/components/layout/shells/AppShell";
import { AdminOnboardingGate } from "@/components/onboarding/AdminOnboardingGate";
import { SHELL_NAV_CONFIG } from "@/components/layout/shells/navigation.config";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/admin/onboarding");

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <AdminOnboardingGate>
      <AppShell config={SHELL_NAV_CONFIG.admin}>{children}</AppShell>
    </AdminOnboardingGate>
  );
}
