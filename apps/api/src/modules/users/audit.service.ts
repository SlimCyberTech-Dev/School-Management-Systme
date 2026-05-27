import type { AuditCategory, AuditOutcome, AuditSeverity } from "@uganda-cbc-sms/shared";
import { writeAuditLog } from "../audit/audit.service";

export type AuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "USER_DELETED"
  | "PASSWORD_RESET"
  | "USER_UNLOCKED"
  | "USER_NOTES_UPDATED"
  | "PROFILE_PHOTO_UPDATED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT";

type LogUserActionInput = {
  userId: string;
  actorId?: string;
  action: AuditAction;
  changedFields?: string[] | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

const ACTION_META: Record<
  AuditAction,
  { category: AuditCategory; severity: AuditSeverity; outcome: AuditOutcome; message: string }
> = {
  USER_CREATED: { category: "users", severity: "info", outcome: "success", message: "User account created" },
  USER_UPDATED: { category: "users", severity: "info", outcome: "success", message: "User account updated" },
  USER_ACTIVATED: { category: "users", severity: "info", outcome: "success", message: "User account activated" },
  USER_DEACTIVATED: { category: "users", severity: "warning", outcome: "success", message: "User account deactivated" },
  USER_DELETED: { category: "users", severity: "warning", outcome: "success", message: "User account deleted" },
  PASSWORD_RESET: { category: "users", severity: "warning", outcome: "success", message: "Password reset by administrator" },
  USER_UNLOCKED: { category: "users", severity: "info", outcome: "success", message: "User account unlocked" },
  USER_NOTES_UPDATED: { category: "users", severity: "info", outcome: "success", message: "Admin notes updated" },
  PROFILE_PHOTO_UPDATED: { category: "users", severity: "info", outcome: "success", message: "Profile photo updated" },
  LOGIN_SUCCESS: { category: "auth", severity: "info", outcome: "success", message: "Login successful" },
  LOGIN_FAILED: { category: "auth", severity: "warning", outcome: "failure", message: "Login failed" },
  LOGOUT: { category: "auth", severity: "info", outcome: "success", message: "User signed out" },
};

export async function logUserAction(input: LogUserActionInput): Promise<void> {
  const meta = ACTION_META[input.action];
  await writeAuditLog({
    category: meta.category,
    severity: meta.severity,
    outcome: meta.outcome,
    action: input.action,
    message: meta.message,
    actorId: input.actorId ?? input.userId,
    targetUserId: input.userId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: {
      ...(input.metadata ?? {}),
      ...(input.changedFields?.length ? { changedFields: input.changedFields } : {}),
    },
    resourceType: "user",
    resourceId: input.userId,
  });
}
