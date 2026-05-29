import type { NextFunction, Request, Response } from "express";
import NodeCache from "node-cache";
import type { Role } from "@uganda-cbc-sms/shared";

const tierA = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const tierB = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const TIER_A_PREFIXES = [
  "/api/academic/years",
  "/api/academic/terms",
  "/api/academic/classes",
  "/api/academic/subjects",
  "/api/fees/structure",
];

const TIER_B_PREFIXES = ["/api/analytics/dashboard", "/api/analytics/", "/api/reports/summary"];

const TIER_B_ROLES = new Set<Role>(["admin", "headteacher"]);

/** Full API path (works inside mounted routers). */
export function requestCachePath(req: Request): string {
  const path = req.path ?? "";
  if (path.startsWith("/api/")) return path;
  const base = req.baseUrl ?? "";
  if (!base) return path;
  return `${base}${path}`.replace(/\/{2,}/g, "/");
}

function tenantIdForCache(req: Request): string | null {
  return req.tenant?.id ?? req.user?.tenantId ?? null;
}

function cacheKey(req: Request): string {
  const role = req.user?.role ?? "anon";
  const tenant = tenantIdForCache(req) ?? "no-tenant";
  const q = JSON.stringify(req.query ?? {});
  return `${req.method}:${requestCachePath(req)}:${q}:${role}:${tenant}`;
}

function pickCache(path: string, role?: Role): NodeCache | null {
  if (TIER_A_PREFIXES.some((p) => path.startsWith(p))) return tierA;
  if (TIER_B_PREFIXES.some((p) => path.startsWith(p)) && role && TIER_B_ROLES.has(role)) {
    return tierB;
  }
  return null;
}

function shouldNeverCache(req: Request): boolean {
  if (req.method !== "GET") return true;
  const path = requestCachePath(req);
  if (path.startsWith("/api/auth")) return true;
  if (/^\/api\/students\/[^/]+$/.test(path)) return true;
  if (path.startsWith("/api/fees/payments")) return true;
  return false;
}

/** Mount after requireAuth + resolveTenant so cache keys are per school and role. */
export function cacheLayerMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (shouldNeverCache(req)) {
    return next();
  }

  if (!tenantIdForCache(req) || !req.user) {
    return next();
  }

  const path = requestCachePath(req);
  const store = pickCache(path, req.user.role);
  if (!store) return next();

  const key = cacheKey(req);
  const hit = store.get<string>(key);
  if (hit) {
    res.setHeader("X-Cache", "HIT");
    const ttl = store.getTtl(key);
    if (ttl) {
      const age = Math.max(0, Math.floor((ttl - Date.now()) / 1000));
      res.setHeader("X-Cache-Age", String(age));
    }
    res.setHeader("Content-Type", "application/json");
    res.send(hit);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        store.set(key, JSON.stringify(body));
      } catch {
        /* ignore */
      }
    }
    res.setHeader("X-Cache", "MISS");
    return originalJson(body);
  };
  next();
}

export function invalidateCachePrefix(prefix: string): void {
  for (const store of [tierA, tierB]) {
    for (const k of store.keys()) {
      if (k.includes(prefix)) store.del(k);
    }
  }
}

const MUTATION_INVALIDATION_PREFIXES = ["/api/academic", "/api/fees/structure"];

/** Clears tier-A academic/fee list caches after successful writes. */
export function invalidateCacheOnMutationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.method === "GET") {
    next();
    return;
  }
  const path = requestCachePath(req);
  const prefixes = MUTATION_INVALIDATION_PREFIXES.filter((p) => path.startsWith(p));
  if (prefixes.length === 0) {
    next();
    return;
  }
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      for (const p of prefixes) {
        invalidateCachePrefix(p);
      }
    }
    return originalJson(body);
  };
  next();
}
