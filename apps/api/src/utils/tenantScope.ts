import { activeTenantIdFromContext } from "./activeTenant.js";

/** Append `alias.tenant_id = $n` for defense-in-depth when RLS is enforced. */
export function tenantFilter(alias: string, paramIndex: number): string {
  return `${alias}.tenant_id = $${paramIndex}`;
}

export function requireTenantScope(): string {
  return activeTenantIdFromContext();
}
