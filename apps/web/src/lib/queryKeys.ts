/** React Query keys scoped per school tenant. */

export function tenantScope(slug: string): string {
  return slug || "default";
}

export const queryKeys = {
  dashboardKpis: (tenantSlug: string) => ["dashboard-kpis", tenantScope(tenantSlug)] as const,
  academicSummary: (tenantSlug: string) => ["academic-summary", tenantScope(tenantSlug)] as const,
};

/** Stable reference data (years, subjects, KPIs) — safe to keep fresh for several minutes. */
export const STRUCTURAL_STALE_MS = 5 * 60 * 1000;
