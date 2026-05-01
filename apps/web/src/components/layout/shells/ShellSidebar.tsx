"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICON_MAP } from "./navIconMap";
import type { RoleShellConfig } from "./types";

function isActive(pathname: string, href: string, activePrefix?: string, exactMatch?: boolean): boolean {
  if (href.endsWith("/dashboard")) return pathname === href;
  if (exactMatch) return pathname === href;
  const p = activePrefix ?? href;
  return pathname === p || pathname.startsWith(`${p}/`);
}

export function ShellSidebar({ config, mobile = false }: { config: RoleShellConfig; mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <aside
      className={`${mobile ? "flex" : "hidden lg:flex"} h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-colors`}
    >
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="text-lg font-semibold text-sidebar-foreground">{config.roleLabel}</div>
        <p className="text-xs text-muted-foreground">{config.productLabel}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {config.items.map((item) => {
          const active = isActive(pathname, item.href, item.activePrefix, item.exactMatch);
          const Icon = NAV_ICON_MAP[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
                active
                  ? "bg-nav-active text-nav-active-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-nav-active-foreground" : "text-muted-foreground group-hover:text-accent-foreground"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
