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
    for (const tid of [tenantA, tenantB]) {
      await withTenant(tid, async (client) => {
        await client.query(`DELETE FROM notifications WHERE tenant_id = $1`, [tid]);
        await client.query(`DELETE FROM password_reset_codes WHERE tenant_id = $1`, [tid]);
        await client.query(`DELETE FROM users WHERE tenant_id = $1`, [tid]);
      });
    }
    await platformPool.query(`DELETE FROM tenant_settings WHERE tenant_id IN ($1, $2)`, [
      tenantA,
      tenantB,
    ]);
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

  it("scopes password_reset_codes to current tenant", async () => {
    if (!dbAvailable) return;
    const sharedEmail = `reset-${Date.now()}@test.local`;

    await withTenant(tenantA, async (client) => {
      await client.query(
        `INSERT INTO password_reset_codes (tenant_id, email, code_hash, expires_at)
         VALUES ($1, $2, 'hash-a', NOW() + interval '15 minutes')`,
        [tenantA, sharedEmail],
      );
    });

    await withTenant(tenantB, async (client) => {
      await client.query(
        `INSERT INTO password_reset_codes (tenant_id, email, code_hash, expires_at)
         VALUES ($1, $2, 'hash-b', NOW() + interval '15 minutes')`,
        [tenantB, sharedEmail],
      );
    });

    const rowsA = await tenantQuery<{ code_hash: string }>(
      tenantA,
      `SELECT code_hash FROM password_reset_codes WHERE email = $1 AND used_at IS NULL`,
      [sharedEmail],
    );
    expect(rowsA.rows).toHaveLength(1);
    expect(rowsA.rows[0]!.code_hash).toBe("hash-a");

    const rowsB = await tenantQuery<{ code_hash: string }>(
      tenantB,
      `SELECT code_hash FROM password_reset_codes WHERE email = $1 AND used_at IS NULL`,
      [sharedEmail],
    );
    expect(rowsB.rows).toHaveLength(1);
    expect(rowsB.rows[0]!.code_hash).toBe("hash-b");
  });

  it("scopes notifications to current tenant", async () => {
    if (!dbAvailable) return;
    const emailA = `notify-a-${Date.now()}@test.local`;
    const emailB = `notify-b-${Date.now()}@test.local`;

    let userA: string;
    let userB: string;

    await withTenant(tenantA, async (client) => {
      const u = await client.query<{ id: string }>(
        `INSERT INTO users (tenant_id, full_name, email, password_hash, role)
         VALUES ($1, 'Notify A', $2, 'hash', 'headteacher')
         RETURNING id`,
        [tenantA, emailA],
      );
      userA = u.rows[0]!.id;
      await client.query(
        `INSERT INTO notifications (tenant_id, user_id, type, title, body)
         VALUES ($1, $2, 'assessment_submitted', 'A title', 'A body')`,
        [tenantA, userA],
      );
    });

    await withTenant(tenantB, async (client) => {
      const u = await client.query<{ id: string }>(
        `INSERT INTO users (tenant_id, full_name, email, password_hash, role)
         VALUES ($1, 'Notify B', $2, 'hash', 'headteacher')
         RETURNING id`,
        [tenantB, emailB],
      );
      userB = u.rows[0]!.id;
      await client.query(
        `INSERT INTO notifications (tenant_id, user_id, type, title, body)
         VALUES ($1, $2, 'assessment_submitted', 'B title', 'B body')`,
        [tenantB, userB],
      );
    });

    const rowsA = await tenantQuery<{ title: string }>(
      tenantA,
      `SELECT title FROM notifications WHERE user_id = $1`,
      [userA!],
    );
    expect(rowsA.rows).toHaveLength(1);
    expect(rowsA.rows[0]!.title).toBe("A title");

    const rowsB = await tenantQuery<{ title: string }>(
      tenantB,
      `SELECT title FROM notifications WHERE user_id = $1`,
      [userB!],
    );
    expect(rowsB.rows).toHaveLength(1);
    expect(rowsB.rows[0]!.title).toBe("B title");
  });
});
