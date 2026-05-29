"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isPublicSchoolAuthPath } from "@/lib/tenantHost";
import { useAuthStore } from "@/store/authStore";

/** Block protected pages until cookie session is hydrated (prevents 401 → logout loops). */
export function AuthBootGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  const isPublic =
    isPublicSchoolAuthPath(pathname) || pathname.startsWith("/platform");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (isPublic || hydrated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-body text-sm text-muted-foreground">Loading session…</p>
    </div>
  );
}
