"use client";

import { ReactNode } from "react";
import { useNavigationLoading } from "@/components/navigation/NavigationProvider";

export function ShellContent({ children }: { children: ReactNode }) {
  const { isNavigating } = useNavigationLoading();

  return (
    <main className="relative min-h-0 flex-1 overflow-y-auto bg-muted/30 transition-ui">
      {isNavigating ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-gradient-to-r from-transparent via-brand/50 to-transparent"
          aria-hidden
        />
      ) : null}
      <div
        className={`mx-auto w-full max-w-[var(--content-max-w)] space-y-6 px-6 py-6 transition-[opacity,transform] duration-200 ease-out ${
          isNavigating ? "opacity-[0.72]" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </main>
  );
}
