import type {
  AuditCategory,
  AuditLog,
  AuditLogsArchiveInput,
  AuditLogsDeleteInput,
  AuditLogsListResponse,
  AuditLogsQuery,
  AuditLogStats,
  AuditOutcome,
  AuditSeverity,
} from "@uganda-cbc-sms/shared";
import { query } from "../../config/db";
import { HttpError } from "../../utils/httpError";

export type WriteAuditLogInput = {
  category: AuditCategory;
  severity?: AuditSeverity;
  outcome?: AuditOutcome;
  action: string;
  message: string;
  actorId?: string | null;
  targetUserId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  httpMethod?: string | null;
  httpPath?: string | null;
  httpStatus?: number | null;
  metadata?: Record<string, unknown> | null;
};

type AuditRow = {
  id: string;
  category: string;
  severity: string;
  outcome: string;
  action: string;
  message: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  target_user_id: string | null;
  target_user_name: string | null;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  http_method: string | null;
  http_path: string | null;
  http_status: number | null;
  metadata: Record<string, unknown> | null;
  archived_at: string | null;
  archived_by: string | null;
  archived_by_name: string | null;
  created_at: string;
};

const LIST_SELECT = `
  l.id,
  l.category,
  l.severity,
  l.outcome,
  l.action,
  l.message,
  l.actor_id,
  actor.full_name AS actor_name,
  actor.email AS actor_email,
  l.target_user_id,
  target_u.full_name AS target_user_name,
  l.resource_type,
  l.resource_id,
  l.ip_address::text AS ip_address,
  l.user_agent,
  l.http_method,
  l.http_path,
  l.http_status,
  l.metadata,
  l.archived_at,
  l.archived_by,
  archiver.full_name AS archived_by_name,
  l.created_at
`;

function mapRow(row: AuditRow): AuditLog {
  return {
    id: row.id,
    category: row.category as AuditLog["category"],
    severity: row.severity as AuditLog["severity"],
    outcome: row.outcome as AuditLog["outcome"],
    action: row.action,
    message: row.message,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    targetUserId: row.target_user_id,
    targetUserName: row.target_user_name,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    httpMethod: row.http_method,
    httpPath: row.http_path,
    httpStatus: row.http_status,
    metadata: row.metadata,
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
    archivedBy: row.archived_by,
    archivedByName: row.archived_by_name,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/** Fire-and-forget safe: never throws to callers. */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<string | null> {
  try {
    const { rows } = await query<{ id: string }>(
      `INSERT INTO audit_logs (
         category, severity, outcome, action, message,
         actor_id, target_user_id, resource_type, resource_id,
         ip_address, user_agent, http_method, http_path, http_status, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULLIF($10, '')::inet, $11, $12, $13, $14, $15::jsonb)
       RETURNING id`,
      [
        input.category,
        input.severity ?? "info",
        input.outcome ?? "success",
        input.action,
        input.message,
        input.actorId ?? null,
        input.targetUserId ?? null,
        input.resourceType ?? null,
        input.resourceId ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.httpMethod ?? null,
        input.httpPath ?? null,
        input.httpStatus ?? null,
        JSON.stringify(input.metadata ?? null),
      ],
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("[audit] failed to write log:", err);
    return null;
  }
}

function buildListFilters(filters: AuditLogsQuery, params: unknown[], archived: boolean) {
  const parts: string[] = [archived ? "l.archived_at IS NOT NULL" : "l.archived_at IS NULL"];

  if (filters.category) {
    params.push(filters.category);
    parts.push(`l.category = $${params.length}`);
  }
  if (filters.severity) {
    params.push(filters.severity);
    parts.push(`l.severity = $${params.length}`);
  }
  if (filters.outcome) {
    params.push(filters.outcome);
    parts.push(`l.outcome = $${params.length}`);
  }
  if (filters.action) {
    params.push(filters.action);
    parts.push(`l.action = $${params.length}`);
  }
  if (filters.actorId) {
    params.push(filters.actorId);
    parts.push(`l.actor_id = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    parts.push(`l.created_at >= $${params.length}::timestamptz`);
  }
  if (filters.to) {
    params.push(filters.to);
    parts.push(`l.created_at <= $${params.length}::timestamptz`);
  }
  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim()}%`);
    const i = params.length;
    parts.push(
      `(l.message ILIKE $${i} OR l.action ILIKE $${i} OR l.ip_address::text ILIKE $${i} OR actor.full_name ILIKE $${i} OR actor.email ILIKE $${i} OR target_u.full_name ILIKE $${i})`,
    );
  }

  return parts.join(" AND ");
}

export async function listAuditLogs(filters: AuditLogsQuery): Promise<AuditLogsListResponse> {
  const archived = filters.view === "archived";
  const params: unknown[] = [];
  const where = buildListFilters(filters, params, archived);

  const countQ = await query<{ c: number }>(
    `SELECT COUNT(*)::int AS c
     FROM audit_logs l
     LEFT JOIN users actor ON actor.id = l.actor_id
     LEFT JOIN users target_u ON target_u.id = l.target_user_id
     WHERE ${where}`,
    params,
  );
  const total = countQ.rows[0]?.c ?? 0;
  const limit = filters.limit;
  const page = filters.page;
  const offset = (page - 1) * limit;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listParams = [...params, limit, offset];
  const { rows } = await query<AuditRow>(
    `SELECT ${LIST_SELECT}
     FROM audit_logs l
     LEFT JOIN users actor ON actor.id = l.actor_id
     LEFT JOIN users target_u ON target_u.id = l.target_user_id
     LEFT JOIN users archiver ON archiver.id = l.archived_by
     WHERE ${where}
     ORDER BY l.created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    items: rows.map(mapRow),
    pagination: { page, limit, total, totalPages },
  };
}

export async function getAuditStats(): Promise<AuditLogStats> {
  const [countsQ, categoryQ] = await Promise.all([
    query<{
      today_count: number;
      errors_24h: number;
      warnings_24h: number;
      active_count: number;
      archived_count: number;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()) AND archived_at IS NULL)::int AS today_count,
         COUNT(*) FILTER (WHERE severity = 'error' AND created_at >= NOW() - interval '24 hours' AND archived_at IS NULL)::int AS errors_24h,
         COUNT(*) FILTER (WHERE severity = 'warning' AND created_at >= NOW() - interval '24 hours' AND archived_at IS NULL)::int AS warnings_24h,
         COUNT(*) FILTER (WHERE archived_at IS NULL)::int AS active_count,
         COUNT(*) FILTER (WHERE archived_at IS NOT NULL)::int AS archived_count
       FROM audit_logs`,
    ),
    query<{ category: string; count: number }>(
      `SELECT category, COUNT(*)::int AS count
       FROM audit_logs
       WHERE archived_at IS NULL AND created_at >= NOW() - interval '7 days'
       GROUP BY category
       ORDER BY count DESC`,
    ),
  ]);
  const c = countsQ.rows[0];
  return {
    todayCount: c?.today_count ?? 0,
    errorsLast24h: c?.errors_24h ?? 0,
    warningsLast24h: c?.warnings_24h ?? 0,
    activeCount: c?.active_count ?? 0,
    archivedCount: c?.archived_count ?? 0,
    byCategory: categoryQ.rows.map((r) => ({
      category: r.category as AuditCategory,
      count: r.count,
    })),
  };
}

export async function archiveAuditLogs(
  input: AuditLogsArchiveInput,
  archivedBy: string,
): Promise<{ archived: number }> {
  if (input.ids?.length) {
    const { rowCount } = await query(
      `UPDATE audit_logs
       SET archived_at = NOW(), archived_by = $2
       WHERE id = ANY($1::uuid[]) AND archived_at IS NULL`,
      [input.ids, archivedBy],
    );
    return { archived: rowCount ?? 0 };
  }

  const params: unknown[] = [input.olderThan, archivedBy];
  const parts = ["archived_at IS NULL", `created_at < $1::timestamptz`];
  if (input.category) {
    params.push(input.category);
    parts.push(`category = $${params.length}`);
  }
  if (input.severity) {
    params.push(input.severity);
    parts.push(`severity = $${params.length}`);
  }

  const { rowCount } = await query(
    `UPDATE audit_logs SET archived_at = NOW(), archived_by = $2 WHERE ${parts.join(" AND ")}`,
    params,
  );
  return { archived: rowCount ?? 0 };
}

export async function deleteAuditLogsPermanently(input: AuditLogsDeleteInput): Promise<{ deleted: number }> {
  const check = await query<{ id: string }>(
    `SELECT id FROM audit_logs WHERE id = ANY($1::uuid[]) AND archived_at IS NULL`,
    [input.ids],
  );
  if (check.rows.length > 0) {
    throw new HttpError(400, "Only archived logs can be permanently deleted. Archive them first.");
  }

  const { rowCount } = await query(`DELETE FROM audit_logs WHERE id = ANY($1::uuid[]) AND archived_at IS NOT NULL`, [
    input.ids,
  ]);
  return { deleted: rowCount ?? 0 };
}

export async function getUserAuditLogsFromSystem(userId: string, limit = 50): Promise<AuditLog[]> {
  const { rows } = await query<AuditRow>(
    `SELECT ${LIST_SELECT}
     FROM audit_logs l
     LEFT JOIN users actor ON actor.id = l.actor_id
     LEFT JOIN users target_u ON target_u.id = l.target_user_id
     LEFT JOIN users archiver ON archiver.id = l.archived_by
     WHERE (l.target_user_id = $1 OR l.actor_id = $1)
     ORDER BY l.created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows.map(mapRow);
}
