"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PlatformAuthGuard } from "@/components/platform/PlatformAuthGuard";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin =
    pathname === "/platform/login" || (pathname?.startsWith("/platform/login/") ?? false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {isLogin ? children : <PlatformAuthGuard>{children}</PlatformAuthGuard>}
    </div>
  );
}
