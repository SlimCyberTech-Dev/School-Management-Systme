import type { NavItem } from "./types";

function navItemMatches(pathname: string, item: NavItem): boolean {
  if (item.href.endsWith("/dashboard")) return pathname === item.href;
  if (item.exactMatch) return pathname === item.href;
  const prefix = item.activePrefix ?? item.href;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Picks the single nav item with the longest matching prefix (avoids parent + child both active). */
export function resolveActiveNavItem(items: NavItem[], pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  let bestScore = -1;

  for (const item of items) {
    if (!navItemMatches(pathname, item)) continue;
    const prefix = item.activePrefix ?? item.href;
    const score = prefix.length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best;
}

export function isNavItemActive(item: NavItem, pathname: string, items: NavItem[]): boolean {
  const active = resolveActiveNavItem(items, pathname);
  return active?.href === item.href;
}
