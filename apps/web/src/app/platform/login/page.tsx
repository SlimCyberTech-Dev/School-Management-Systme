"use client";

import { Suspense } from "react";
import { PlatformLoginScreen } from "@/components/platform/PlatformLoginScreen";

function LoginFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#030712]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-400" />
      <p className="font-mono text-xs uppercase tracking-widest text-slate-600">
        Loading control plane…
      </p>
    </div>
  );
}

export default function PlatformLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <PlatformLoginScreen />
    </Suspense>
  );
}
