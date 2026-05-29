/** Subdomain slug for the current school tenant, or null on bare localhost. */
export function getTenantSlugFromHostname(hostname: string): string | null {
  const host = hostname.split(":")[0]!.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }
  if (host.endsWith(".localhost")) {
    const label = host.slice(0, -".localhost".length);
    const parts = label.split(".");
    const slug = parts[parts.length - 1] ?? null;
    if (!slug || slug === "platform" || slug === "www" || slug === "api") {
      return slug === "platform" ? "platform" : null;
    }
    return slug;
  }
  const parts = host.split(".");
  if (parts.length >= 3) {
    const slug = parts[0]!;
    if (slug === "platform" || slug === "www" || slug === "api") {
      return slug === "platform" ? "platform" : null;
    }
    return slug;
  }
  return null;
}

export function isPlatformHost(hostname: string): boolean {
  return getTenantSlugFromHostname(hostname) === "platform";
}

export function schoolLoginUrl(slug: string): string {
  if (typeof window !== "undefined") {
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${window.location.protocol}//${slug}.localhost${port}/login`;
  }
  return `http://${slug}.localhost:3000/login`;
}
