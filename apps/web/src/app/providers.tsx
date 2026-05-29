"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthBootGate } from "@/components/auth/AuthBootGate";
import { SessionIdleGuard } from "@/components/auth/SessionIdleGuard";
import { ToastHost } from "@/components/ui/ToastHost";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="uganda-cbc-sms-theme"
      >
        <AuthBootGate>{children}</AuthBootGate>
        <SessionIdleGuard />
        <ToastHost />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
