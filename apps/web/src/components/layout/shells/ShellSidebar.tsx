"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type MouseEvent } from "react";
import { useNavigationLoading } from "@/components/navigation/NavigationProvider";
import { NAV_ICON_MAP } from "./navIconMap";
import { isNavItemActive } from "./navActive";
import { resolveUploadUrl } from "@/lib/media";
import { useAuthStore } from "@/store/authStore";
import type { NavItem, RoleShellConfig } from "./types";

type ShellSidebarProps = {
  config: RoleShellConfig;
  mobile?: boolean;
  onNavigate?: () => void;
};

function NavLink({
  item,
  active,
  pending,
  onNavClick,
}: {
  item: NavItem;
  active: boolean;
  pending?: boolean;
  onNavClick: (href: string, onDone?: () => void) => void;
}) {
  const Icon = NAV_ICON_MAP[item.icon];

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavClick(item.href);
  };

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      aria-current={active ? "page" : undefined}
      aria-busy={pending}
      className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
        pending ? "opacity-70" : ""
      } ${
        active
          ? "bg-nav-active font-medium text-nav-active-foreground shadow-sm"
          : "font-normal text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
    >
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand"
          aria-hidden
        />
      ) : null}
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-ui ${
          active
            ? "bg-brand/15 text-brand dark:bg-brand/25 dark:text-emerald-300"
            : "bg-sidebar-accent/80 text-sidebar-muted group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground"
        }`}
      >
        <Icon className="h-[1.125rem] w-[1.125rem] stroke-[1.75]" />
      </span>
      <span className="min-w-0 flex-1 truncate leading-snug">{item.label}</span>
      {pending ? (
        <span
          className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

export function ShellSidebar({ config, mobile = false, onNavigate }: ShellSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { startNavigation } = useNavigationLoading();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const handleNavClick = (href: string) => {
    startNavigation();
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
      onNavigate?.();
    });
  };

  const initials = useMemo(() => {
    const fullName = user?.fullName?.trim() ?? "";
    if (!fullName) return "UC";
    const parts = fullName.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "UC";
  }, [user?.fullName]);

  const avatarUrl = useMemo(() => resolveUploadUrl(user?.photoUrl), [user?.photoUrl]);

  const { mainItem, menuItems } = useMemo(() => {
    const dashboard = config.items.find((i) => i.href.endsWith("/dashboard"));
    const rest = config.items.filter((i) => !i.href.endsWith("/dashboard"));
    return { mainItem: dashboard, menuItems: rest };
  }, [config.items]);

  return (
    <aside
      className={`${mobile ? "flex" : "hidden lg:flex"} h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-ui`}
    >
      {/* Brand */}
      <div className="flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-card shadow-sm">
          <Image
            src="/images/Logo.jpeg"
            alt=""
            width={36}
            height={36}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold leading-tight text-sidebar-foreground">
            Uganda CBC SMS
          </p>
          <p className="truncate text-[11px] text-sidebar-muted">{config.roleLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin]">
        {mainItem ? (
          <div className="mb-5">
            <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
              Overview
            </p>
            <NavLink
              item={mainItem}
              active={isNavItemActive(mainItem, pathname, config.items)}
              pending={pendingHref === mainItem.href}
              onNavClick={handleNavClick}
            />
          </div>
        ) : null}

        {menuItems.length > 0 ? (
          <div>
            <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
              Menu
            </p>
            <nav className="flex flex-col gap-0.5">
              {menuItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isNavItemActive(item, pathname, config.items)}
                  pending={pendingHref === item.href}
                  onNavClick={handleNavClick}
                />
              ))}
            </nav>
          </div>
        ) : null}
      </div>

      {/* User */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => {
            startNavigation();
            startTransition(() => {
              onNavigate?.();
              router.push("/profile");
            });
          }}
          className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-2.5 text-left transition-ui hover:border-brand/30 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-semibold text-foreground">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" sizes="36px" unoptimized />
            ) : (
              initials
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">
              {user?.fullName ?? "Signed in"}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-sidebar-muted">
              {user?.email ?? config.roleLabel}
            </span>
          </span>
        </button>
      </div>
    </aside>
  );
}
