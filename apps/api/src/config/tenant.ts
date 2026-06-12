import type { PoolClient } from "pg";
import { query } from "./db.js";

let cachedDefaultTenantId: string | null = null;

export type TenantRow = {
  id: string;
  slug: string;
  display_name: string;
  status: string;
};

export async function getDefaultTenantSlug(): Promise<string> {
  return process.env.DEFAULT_TENANT_SLUG?.trim() || "default";
}

export async function resolveTenantIdBySlug(slug: string): Promise<string | null> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM tenants WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  return rows[0]?.id ?? null;
}

export async function getDefaultTenantId(): Promise<string> {
  if (cachedDefaultTenantId) return cachedDefaultTenantId;
  const slug = await getDefaultTenantSlug();
  const id = await resolveTenantIdBySlug(slug);
  if (!id) {
    throw new Error(`Default tenant not found for slug "${slug}". Run migrations and seed.`);
  }
  cachedDefaultTenantId = id;
  return id;
}

export function clearDefaultTenantCache(): void {
  cachedDefaultTenantId = null;
}

export async function setTenantLocal(client: PoolClient, tenantId: string): Promise<void> {
  await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
}

export async function lookupTenantBySubdomain(subdomain: string): Promise<TenantRow | null> {
  const { rows } = await query<TenantRow>(
    `SELECT t.id, t.slug, t.display_name, t.status
     FROM tenant_domains d
     JOIN tenants t ON t.id = d.tenant_id
     WHERE d.subdomain = $1
     LIMIT 1`,
    [subdomain.toLowerCase()],
  );
  return rows[0] ?? null;
}
