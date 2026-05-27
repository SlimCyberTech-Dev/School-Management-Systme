import { z } from "zod";

export const AUDIT_CATEGORIES = [
  "auth",
  "users",
  "students",
  "academic",
  "assessments",
  "exams",
  "attendance",
  "fees",
  "reports",
  "timetable",
  "system",
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_SEVERITIES = ["info", "warning", "error"] as const;
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

export const AUDIT_OUTCOMES = ["success", "failure"] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export const AUDIT_VIEWS = ["active", "archived"] as const;
export type AuditView = (typeof AUDIT_VIEWS)[number];

export const auditCategorySchema = z.enum(AUDIT_CATEGORIES);
export const auditSeveritySchema = z.enum(AUDIT_SEVERITIES);
export const auditOutcomeSchema = z.enum(AUDIT_OUTCOMES);
export const auditViewSchema = z.enum(AUDIT_VIEWS);

export const auditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  view: auditViewSchema.default("active"),
  category: auditCategorySchema.optional(),
  severity: auditSeveritySchema.optional(),
  outcome: auditOutcomeSchema.optional(),
  action: z.string().max(80).optional(),
  actorId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
});

export const auditLogsArchiveSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(500).optional(),
    olderThan: z.string().max(40).optional(),
    category: auditCategorySchema.optional(),
    severity: auditSeveritySchema.optional(),
  })
  .refine((v) => (v.ids?.length ?? 0) > 0 || Boolean(v.olderThan), {
    message: "Provide ids or olderThan to archive logs",
  });

export const auditLogsDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;
export type AuditLogsArchiveInput = z.infer<typeof auditLogsArchiveSchema>;
export type AuditLogsDeleteInput = z.infer<typeof auditLogsDeleteSchema>;

export type AuditLog = {
  id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  outcome: AuditOutcome;
  action: string;
  message: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  targetUserId: string | null;
  targetUserName: string | null;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  httpMethod: string | null;
  httpPath: string | null;
  httpStatus: number | null;
  metadata: Record<string, unknown> | null;
  archivedAt: string | null;
  archivedBy: string | null;
  archivedByName: string | null;
  createdAt: string;
};

export type AuditLogsListResponse = {
  items: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AuditLogStats = {
  todayCount: number;
  errorsLast24h: number;
  warningsLast24h: number;
  activeCount: number;
  archivedCount: number;
  byCategory: Array<{ category: AuditCategory; count: number }>;
};
