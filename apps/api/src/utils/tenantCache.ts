import type { TenantRow } from "../config/tenant.js";
import { lookupTenantBySubdomain } from "../config/tenant.js";

const TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  tenant: TenantRow;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function invalidateTenantCache(slug?: string): void {
  if (slug) {
    cache.delete(normalizeSlug(slug));
    return;
  }
  cache.clear();
}

/** Resolve school by subdomain with in-memory TTL cache (per API instance). */
export async function getCachedTenantBySlug(slug: string): Promise<TenantRow | null> {
  const key = normalizeSlug(slug);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.tenant;
  }
  const tenant = await lookupTenantBySubdomain(key);
  if (tenant) {
    cache.set(key, { tenant, expiresAt: Date.now() + TTL_MS });
  } else {
    cache.delete(key);
  }
  return tenant;
}
