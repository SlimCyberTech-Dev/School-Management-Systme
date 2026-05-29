import type { CreateTenantInput, UpdateTenantInput } from "@uganda-cbc-sms/shared";
import bcrypt from "bcrypt";
import { platformPool } from "../../config/db.js";
import { loadEnv } from "../../config/env.js";
import { HttpError } from "../../utils/httpError.js";

export type TenantListItem = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  subdomain: string;
  schoolName: string | null;
  createdAt: string;
};

const DEFAULT_REPORT_LAYOUT = {
  template: "modern",
  density: "comfortable",
  showStudentPhoto: true,
  showTableStripes: true,
  headerAlignment: "left",
  cornerRadius: 4,
  baseFontSize: 9,
};

export async function listTenants(): Promise<TenantListItem[]> {
  const client = await platformPool.connect();
  try {
    const { rows } = await client.query<{
      id: string;
      slug: string;
      display_name: string;
      status: string;
      subdomain: string;
      school_name: string | null;
      created_at: Date;
    }>(
      `SELECT t.id, t.slug, t.display_name, t.status, d.subdomain,
              ts.school_name, t.created_at
       FROM tenants t
       JOIN tenant_domains d ON d.tenant_id = t.id AND d.is_primary = TRUE
       LEFT JOIN tenant_settings ts ON ts.tenant_id = t.id
       ORDER BY t.created_at DESC`,
    );
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      displayName: r.display_name,
      status: r.status,
      subdomain: r.subdomain,
      schoolName: r.school_name,
      createdAt: r.created_at.toISOString(),
    }));
  } finally {
    client.release();
  }
}

export async function createTenant(input: CreateTenantInput): Promise<TenantListItem> {
  const env = loadEnv();
  const slug = input.slug.toLowerCase();
  const email = input.adminEmail.toLowerCase().trim();
  const hash = await bcrypt.hash(input.adminPassword, env.BCRYPT_ROUNDS);
  const adminName = input.adminFullName?.trim() || `${input.displayName} Administrator`;

  const client = await platformPool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(`SELECT 1 FROM tenants WHERE slug = $1`, [slug]);
    if (existing.rowCount && existing.rowCount > 0) {
      throw new HttpError(409, "A school with this slug already exists.");
    }

    const tenant = await client.query<{ id: string }>(
      `INSERT INTO tenants (slug, display_name, status)
       VALUES ($1, $2, 'active')
       RETURNING id`,
      [slug, input.displayName.trim()],
    );
    const tenantId = tenant.rows[0]!.id;

    await client.query(
      `INSERT INTO tenant_domains (tenant_id, subdomain, is_primary)
       VALUES ($1, $2, TRUE)`,
      [tenantId, slug],
    );

    await client.query(
      `INSERT INTO tenant_settings (
         tenant_id, school_name, motto, primary_color, secondary_color,
         report_footer_text, report_layout
       )
       VALUES ($1, $2, 'Learning with purpose', '#1D4ED8', '#0F172A',
         'This report is system-generated and valid without signature.',
         $3::jsonb)`,
      [tenantId, input.displayName.trim(), JSON.stringify(DEFAULT_REPORT_LAYOUT)],
    );

    await client.query(
      `INSERT INTO users (tenant_id, full_name, email, password_hash, role, is_active, force_password_change)
       VALUES ($1, $2, $3, $4, 'admin', TRUE, FALSE)`,
      [tenantId, adminName, email, hash],
    );

    await client.query("COMMIT");
    return {
      id: tenantId,
      slug,
      displayName: input.displayName.trim(),
      status: "active",
      subdomain: slug,
      schoolName: input.displayName.trim(),
      createdAt: new Date().toISOString(),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateTenant(
  tenantId: string,
  input: UpdateTenantInput,
): Promise<TenantListItem> {
  const client = await platformPool.connect();
  try {
    if (input.displayName !== undefined) {
      await client.query(
        `UPDATE tenants SET display_name = $2, updated_at = NOW() WHERE id = $1`,
        [tenantId, input.displayName.trim()],
      );
      await client.query(
        `UPDATE tenant_settings SET school_name = $2, updated_at = NOW() WHERE tenant_id = $1`,
        [tenantId, input.displayName.trim()],
      );
    }
    if (input.status !== undefined) {
      await client.query(
        `UPDATE tenants SET status = $2, updated_at = NOW() WHERE id = $1`,
        [tenantId, input.status],
      );
    }
    const { rows } = await client.query<{
      id: string;
      slug: string;
      display_name: string;
      status: string;
      subdomain: string;
      school_name: string | null;
      created_at: Date;
    }>(
      `SELECT t.id, t.slug, t.display_name, t.status, d.subdomain,
              ts.school_name, t.created_at
       FROM tenants t
       JOIN tenant_domains d ON d.tenant_id = t.id AND d.is_primary = TRUE
       LEFT JOIN tenant_settings ts ON ts.tenant_id = t.id
       WHERE t.id = $1`,
      [tenantId],
    );
    if (!rows[0]) throw new HttpError(404, "Tenant not found.");
    const r = rows[0];
    return {
      id: r.id,
      slug: r.slug,
      displayName: r.display_name,
      status: r.status,
      subdomain: r.subdomain,
      schoolName: r.school_name,
      createdAt: r.created_at.toISOString(),
    };
  } finally {
    client.release();
  }
}

export async function resetTenantAdminPassword(
  tenantId: string,
  newPassword: string,
): Promise<void> {
  const env = loadEnv();
  const hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  const client = await platformPool.connect();
  try {
    const { rowCount } = await client.query(
      `UPDATE users
       SET password_hash = $2, force_password_change = TRUE, updated_at = NOW()
       WHERE tenant_id = $1 AND role = 'admin' AND deleted_at IS NULL`,
      [tenantId, hash],
    );
    if (!rowCount) {
      throw new HttpError(404, "No active school admin found for this tenant.");
    }
  } finally {
    client.release();
  }
}
