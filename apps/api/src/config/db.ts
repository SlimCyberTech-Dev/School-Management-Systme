import { AsyncLocalStorage } from "async_hooks";
import pg from "pg";
import "./env-bootstrap.js";
import { setTenantLocal } from "./tenant.js";

/** Active tenant for the current request (set by middleware). */
export const tenantContext = new AsyncLocalStorage<string>();

type RequestDbStore = { client: pg.PoolClient };

/** Pooled client bound to the current HTTP request (see requestDb middleware). */
export const requestDbStorage = new AsyncLocalStorage<RequestDbStore>();

export function getRequestDbClient(): pg.PoolClient | null {
  return requestDbStorage.getStore()?.client ?? null;
}

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set");
}

function resolvePoolOptions(connectionString: string | undefined): pg.PoolConfig {
  if (!connectionString) return {};
  try {
    const normalized = connectionString.replace(/^postgresql:/, "postgres:");
    const url = new URL(normalized);
    const isRenderExternal = url.hostname.endsWith(".render.com");
    const sslMode = url.searchParams.get("sslmode");
    if (isRenderExternal || sslMode === "require" || sslMode === "verify-full") {
      return {
        connectionString,
        ssl: { rejectUnauthorized: false },
      };
    }
  } catch {
    /* use plain connection string */
  }
  return { connectionString };
}

const poolConnectionString = process.env.DATABASE_URL;
const platformConnectionString =
  process.env.PLATFORM_DATABASE_URL?.trim() || poolConnectionString;

export const pool = new Pool({
  ...resolvePoolOptions(poolConnectionString),
  max: 20,
  idleTimeoutMillis: 30000,
});

/** Platform operations (tenant provisioning). Uses BYPASSRLS role in production when configured. */
export const platformPool = new Pool({
  ...resolvePoolOptions(platformConnectionString),
  max: 5,
  idleTimeoutMillis: 30000,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const requestClient = getRequestDbClient();
  if (requestClient) {
    return requestClient.query<T>(text, params);
  }
  const tid = tenantContext.getStore();
  if (!tid) {
    return pool.query<T>(text, params);
  }
  return tenantQuery<T>(tid, text, params);
}

export async function platformQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return platformPool.query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const requestClient = getRequestDbClient();
  if (requestClient) {
    return fn(requestClient);
  }

  const client = await pool.connect();
  const tid = tenantContext.getStore();
  try {
    await client.query("BEGIN");
    if (tid) {
      await setTenantLocal(client, tid);
    }
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** Run queries with PostgreSQL session tenant context (RLS). Used outside HTTP request scope. */
export async function withTenant<T>(
  tenantId: string,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await setTenantLocal(client, tenantId);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function tenantQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  tenantId: string,
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return withTenant(tenantId, (client) => client.query<T>(text, params));
}
