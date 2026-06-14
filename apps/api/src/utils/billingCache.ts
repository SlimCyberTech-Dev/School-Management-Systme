import type { TenantBillingStatus } from "@uganda-cbc-sms/shared";

const SETTINGS_TTL_MS = 5 * 60 * 1000;
const STATUS_TTL_MS = 60 * 1000;

type BillingSettings = {
  defaultAmountUgx: number;
  currency: string;
  graceDays: number;
};

let settingsCache: { value: BillingSettings; expiresAt: number } | null = null;
const statusCache = new Map<string, { value: TenantBillingStatus; expiresAt: number }>();

export function getCachedBillingSettings(): BillingSettings | null {
  if (settingsCache && settingsCache.expiresAt > Date.now()) {
    return settingsCache.value;
  }
  return null;
}

export function setCachedBillingSettings(value: BillingSettings): void {
  settingsCache = { value, expiresAt: Date.now() + SETTINGS_TTL_MS };
}

export function invalidateBillingSettingsCache(): void {
  settingsCache = null;
}

export function getCachedTenantBillingStatus(tenantId: string): TenantBillingStatus | null {
  const hit = statusCache.get(tenantId);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  if (hit) statusCache.delete(tenantId);
  return null;
}

export function setCachedTenantBillingStatus(
  tenantId: string,
  value: TenantBillingStatus,
): void {
  statusCache.set(tenantId, { value, expiresAt: Date.now() + STATUS_TTL_MS });
}

export function invalidateTenantBillingStatus(tenantId?: string): void {
  if (tenantId) {
    statusCache.delete(tenantId);
    return;
  }
  statusCache.clear();
}
