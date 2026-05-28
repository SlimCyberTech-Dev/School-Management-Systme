"use client";

import { ReactNode, useState } from "react";
import { FetchingBar } from "@/components/feedback/FetchingBar";
import { ShellContent } from "./ShellContent";
import { ShellHeader } from "./ShellHeader";
import { ShellSidebar } from "./ShellSidebar";
import type { RoleShellConfig } from "./types";

type Props = {
  config: RoleShellConfig;
  children: ReactNode;
};

export function AppShell({ config, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background transition-ui">
      <FetchingBar />
      <ShellSidebar config={config} />
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="h-full w-[min(100vw,var(--sidebar-width))] shadow-2xl transition-ui"
            onClick={(e) => e.stopPropagation()}
          >
            <ShellSidebar config={config} mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ShellHeader config={config} onToggleMobileNav={() => setMobileOpen((v) => !v)} />
        <ShellContent>{children}</ShellContent>
      </div>
    </div>
  );
}
