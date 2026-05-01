"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import type { RoleShellConfig } from "./types";

type Props = {
  config: RoleShellConfig;
  onToggleMobileNav?: () => void;
};

export function ShellHeader({ config, onToggleMobileNav }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur transition-colors lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <span className="font-heading text-sm font-semibold text-foreground">{config.productLabel}</span>
          <span className="font-body text-xs text-muted-foreground">{config.roleLabel} workspace</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Badge tone="success">{user?.role?.replace(/_/g, " ") ?? config.roleLabel}</Badge>
        <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 sm:flex">
          <ShieldCheck className="h-4 w-4 text-brand" />
          <span className="font-body text-xs text-muted-foreground">{user?.fullName ?? "Signed in user"}</span>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
