/** React Query keys scoped per school tenant. */

export function tenantScope(slug: string): string {
  return slug || "default";
}

export const queryKeys = {
  dashboardKpis: (tenantSlug: string) => ["dashboard-kpis", tenantScope(tenantSlug)] as const,
  academicSummary: (tenantSlug: string) => ["academic-summary", tenantScope(tenantSlug)] as const,
  curriculumStatus: (tenantSlug: string, academicYearId: string) =>
    ["curriculum-status", tenantScope(tenantSlug), academicYearId] as const,
  structureStatus: (tenantSlug: string, academicYearId: string) =>
    ["structure-status", tenantScope(tenantSlug), academicYearId] as const,
  academicSetupStatus: (tenantSlug: string, academicYearId: string) =>
    ["academic-setup-status", tenantScope(tenantSlug), academicYearId] as const,
  notificationUnreadCount: (tenantSlug: string) =>
    ["notifications", tenantScope(tenantSlug), "unread-count"] as const,
  notificationsList: (tenantSlug: string) =>
    ["notifications", tenantScope(tenantSlug), "list"] as const,
  notificationPreferences: (tenantSlug: string) =>
    ["notification-preferences", tenantScope(tenantSlug)] as const,
};

/** Stable reference data (years, subjects, KPIs) — safe to keep fresh for several minutes. */
export const STRUCTURAL_STALE_MS = 5 * 60 * 1000;

/** Live notification unread badge — polled while the app shell is open. */
export const NOTIFICATIONS_POLL_MS = 60 * 1000;
export const NOTIFICATIONS_STALE_MS = 30 * 1000;
