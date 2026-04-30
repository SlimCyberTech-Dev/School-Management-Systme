"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
