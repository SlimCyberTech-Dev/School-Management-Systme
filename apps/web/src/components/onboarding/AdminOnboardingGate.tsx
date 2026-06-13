"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { OnboardingStatus } from "@uganda-cbc-sms/shared";
import { apiGet } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function AdminOnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isOnboarding = pathname?.startsWith("/admin/onboarding");

  const statusQ = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => apiGet<OnboardingStatus>("/onboarding/status"),
    enabled: Boolean(user?.role === "admin" && hydrated && !isOnboarding),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!hydrated || user?.role !== "admin" || isOnboarding) return;
    const status = statusQ.data;
    if (!status) return;
    if (status.required || user.forcePasswordChange) {
      router.replace("/admin/onboarding");
    }
  }, [hydrated, user, isOnboarding, statusQ.data, router]);

  if (user?.role === "admin" && !isOnboarding && statusQ.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading school setup…</p>
      </div>
    );
  }

  return <>{children}</>;
}
