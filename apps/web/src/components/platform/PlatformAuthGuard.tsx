"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getPlatformTokenFromCookie } from "@/lib/cookies";
import { clearLegacyPlatformStorage } from "@/lib/platformApi";
import { isValidPlatformToken } from "@/lib/platformSession";
import { usePlatformStore } from "@/store/platformStore";

export function PlatformAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = usePlatformStore((s) => s.hydrated);
  const isAuthenticated = usePlatformStore((s) => s.isAuthenticated);
  const hydrate = usePlatformStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    clearLegacyPlatformStorage();
    const token = getPlatformTokenFromCookie();
    if (!isValidPlatformToken(token)) {
      usePlatformStore.getState().logout();
      router.replace("/platform/login");
      return;
    }
    void hydrate().finally(() => setReady(true));
  }, [pathname, router, hydrate]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/platform/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!ready || !hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          <p className="text-sm text-slate-400">Checking platform session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
