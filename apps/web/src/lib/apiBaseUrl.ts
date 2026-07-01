/**
 * Resolve the browser API base URL. Production builds must set NEXT_PUBLIC_API_URL.
 * Always ends with `/api` so paths like `/notifications` resolve correctly.
 */
export function resolveApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").trim();
  if (!raw) return "http://localhost:5000/api";

  // Same-origin proxy: web rewrites /api/* → API_INTERNAL_ORIGIN (see next.config.mjs).
  if (raw.startsWith("/")) {
    const path = raw.replace(/\/+$/, "");
    return path.endsWith("/api") ? path : `${path}/api`;
  }

  const withoutTrailing = raw.replace(/\/+$/, "");
  if (/\/api$/i.test(withoutTrailing)) return withoutTrailing;
  return `${withoutTrailing}/api`;
}

/** Origin without the /api suffix (for Next.js rewrites and upload URLs). */
export function resolveApiOrigin(): string {
  return resolveApiBaseUrl().replace(/\/api\/?$/i, "");
}
