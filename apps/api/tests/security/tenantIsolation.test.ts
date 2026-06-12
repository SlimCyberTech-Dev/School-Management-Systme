import { pool, tenantQuery, withTenant } from "../../src/config/db.js";
import { platformPool } from "../../src/config/db.js";

describe("tenant isolation", () => {
  let tenantA: string;
  let tenantB: string;
  let dbAvailable = true;

  beforeAll(async () => {
    try {
      await platformPool.query("SELECT 1");
    } catch {
      dbAvailable = false;
      return;
    }
    const a = await platformPool.query<{ id: string }>(
      `INSERT INTO tenants (slug, display_name) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id`,
      [`test-a-${Date.now()}`, "Test School A"],
    );
    tenantA = a.rows[0]!.id;
    const b = await platformPool.query<{ id: string }>(
      `INSERT INTO tenants (slug, display_name) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id`,
      [`test-b-${Date.now()}`, "Test School B"],
    );
    tenantB = b.rows[0]!.id;

    await platformPool.query(
      `INSERT INTO tenant_settings (tenant_id, school_name) VALUES ($1, 'A'), ($2, 'B')
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenantA, tenantB],
    );
  });

  afterAll(async () => {
    if (!dbAvailable) {
      await pool.end().catch(() => undefined);
      await platformPool.end().catch(() => undefined);
      return;
    }
    await platformPool.query(`DELETE FROM tenants WHERE id IN ($1, $2)`, [tenantA, tenantB]);
    await pool.end();
    await platformPool.end();
  });

  it("scopes SELECT to current tenant when session variable is set", async () => {
    if (!dbAvailable) return;
    const emailA = `a-${Date.now()}@test.local`;
    const emailB = `b-${Date.now()}@test.local`;

    await withTenant(tenantA, async (client) => {
      await client.query(
        `INSERT INTO users (tenant_id, full_name, email, password_hash, role)
         VALUES ($1, 'User A', $2, 'hash', 'admin')`,
        [tenantA, emailA],
      );
    });

    await withTenant(tenantB, async (client) => {
      await client.query(
        `INSERT INTO users (tenant_id, full_name, email, password_hash, role)
         VALUES ($1, 'User B', $2, 'hash', 'admin')`,
        [tenantB, emailB],
      );
    });

    const rowsA = await tenantQuery<{ email: string }>(
      tenantA,
      `SELECT email FROM users WHERE email = $1`,
      [emailA],
    );
    expect(rowsA.rows).toHaveLength(1);

    const cross = await tenantQuery<{ email: string }>(
      tenantA,
      `SELECT email FROM users WHERE email = $1`,
      [emailB],
    );
    expect(cross.rows).toHaveLength(0);
  });
});
