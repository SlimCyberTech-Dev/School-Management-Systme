"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PlatformAuthGuard } from "@/components/platform/PlatformAuthGuard";
import { PlatformSessionIdleGuard } from "@/components/platform/PlatformSessionIdleGuard";
import { clearLegacyPlatformStorage } from "@/lib/platformApi";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin =
    pathname === "/platform/login" || (pathname?.startsWith("/platform/login/") ?? false);

  useEffect(() => {
    clearLegacyPlatformStorage();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {isLogin ? (
        children
      ) : (
        <PlatformAuthGuard>
          <PlatformSessionIdleGuard />
          {children}
        </PlatformAuthGuard>
      )}
    </div>
  );
}
