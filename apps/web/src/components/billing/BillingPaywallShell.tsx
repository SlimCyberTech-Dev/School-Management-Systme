"use client";

import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { BrandGradientStrip } from "@/components/brand/BrandGradientStrip";
import { BrandMark } from "@/components/brand/BrandMark";
import { useAuthStore } from "@/store/authStore";

export function BillingPaywallShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logoutRemote = useAuthStore((s) => s.logoutRemote);

  return (
    <div className="min-h-screen bg-background">
      <BrandGradientStrip className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <BrandMark
            tone="gradient"
            size="compact"
            subtitle={user?.fullName ?? "Billing"}
          />
          <button
            type="button"
            onClick={() => void logoutRemote()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </BrandGradientStrip>
      <main>{children}</main>
    </div>
  );
}
