import type { NextFunction, Request, Response } from "express";
import type { PoolClient } from "pg";
import { pool, requestDbStorage, tenantContext } from "../config/db.js";
import { setTenantLocal } from "../config/tenant.js";

/**
 * One BEGIN + tenant session per request; replaces per-query tenantQuery transactions.
 * Skips when no school tenant (e.g. bare health, platform-only paths without req.tenant).
 */
export async function requestDbMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    next();
    return;
  }

  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch (e) {
    next(e);
    return;
  }

  let released = false;

  const release = async (commit: boolean) => {
    if (released) return;
    released = true;
    try {
      if (commit) {
        await client.query("COMMIT");
      } else {
        await client.query("ROLLBACK");
      }
    } catch (err) {
      console.error("requestDb: transaction end failed", err);
    } finally {
      client.release();
    }
  };

  const onFinish = () => void release(true);
  const onClose = () => void release(false);

  res.once("finish", onFinish);
  res.once("close", onClose);

  try {
    await client.query("BEGIN");
    await setTenantLocal(client, tenantId);

    requestDbStorage.run({ client }, () => {
      tenantContext.run(tenantId, () => next());
    });
  } catch (e) {
    res.off("finish", onFinish);
    res.off("close", onClose);
    await release(false);
    next(e);
  }
}
