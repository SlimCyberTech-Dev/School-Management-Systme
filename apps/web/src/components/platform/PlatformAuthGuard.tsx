"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PLATFORM_TOKEN_KEY, setPlatformToken } from "@/lib/platformApi";
import { clearPlatformSessionCookie, isValidPlatformToken } from "@/lib/platformSession";

export function PlatformAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
    if (!isValidPlatformToken(token)) {
      setPlatformToken(null);
      clearPlatformSessionCookie();
      router.replace("/platform/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-400">Checking platform session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
