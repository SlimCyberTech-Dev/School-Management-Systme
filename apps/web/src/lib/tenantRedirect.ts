/** Build school app URL for a tenant slug (dev: *.localhost). */
export function schoolAppOrigin(slug: string): string {
  if (typeof window === "undefined") {
    return `http://${slug}.localhost:3000`;
  }
  const port = window.location.port ? `:${window.location.port}` : "";
  return `${window.location.protocol}//${slug}.localhost${port}`;
}

export function redirectToSchoolTenant(slug: string, path: string): void {
  if (typeof window === "undefined") return;
  window.location.href = `${schoolAppOrigin(slug)}${path.startsWith("/") ? path : `/${path}`}`;
}
