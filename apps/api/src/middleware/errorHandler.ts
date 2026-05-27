import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { AuditCategory } from "@uganda-cbc-sms/shared";
import { writeAuditLog } from "../modules/audit/audit.service";
import { HttpError } from "../utils/httpError";

function friendlyZodMessage(err: ZodError): string {
  return err.errors
    .map((issue) => {
      const last = issue.path.length ? issue.path[issue.path.length - 1] : null;
      const key =
        typeof last === "string" ? last : typeof last === "number" ? String(last) : "";
      const spaced = key ? key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim() : "";
      const label = spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "";
      const prefix = label ? `${label}: ` : "";
      return `${prefix}${issue.message}`;
    })
    .join(" ");
}

function categoryFromPath(path: string): AuditCategory {
  if (path.startsWith("/api/auth")) return "auth";
  if (path.startsWith("/api/users")) return "users";
  if (path.startsWith("/api/students")) return "students";
  if (path.startsWith("/api/academic")) return "academic";
  if (path.startsWith("/api/assessments")) return "assessments";
  if (path.startsWith("/api/exams")) return "exams";
  if (path.startsWith("/api/attendance")) return "attendance";
  if (path.startsWith("/api/fees")) return "fees";
  if (path.startsWith("/api/reports")) return "reports";
  if (path.startsWith("/api/timetable")) return "timetable";
  return "system";
}

function shouldSkipAuditLog(req: Request): boolean {
  const path = req.path ?? "";
  if (path === "/api/health" || path.startsWith("/uploads")) return true;
  return false;
}

async function logHttpError(req: Request, status: number, message: string, action: string): Promise<void> {
  if (status < 400 || shouldSkipAuditLog(req)) return;
  const severity = status >= 500 ? "error" : status >= 400 ? "warning" : "info";
  void writeAuditLog({
    category: categoryFromPath(req.path ?? ""),
    severity,
    outcome: "failure",
    action,
    message,
    actorId: req.user?.id ?? null,
    ipAddress: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    httpMethod: req.method,
    httpPath: req.originalUrl ?? req.path,
    httpStatus: status,
    metadata: { error: message },
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const msg = friendlyZodMessage(err);
    void logHttpError(req, 400, msg, "VALIDATION_ERROR");
    res.status(400).json({ success: false, error: msg });
    return;
  }
  if (err instanceof HttpError) {
    void logHttpError(req, err.status, err.message, `HTTP_${err.status}`);
    res.status(err.status).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  const status =
    err instanceof Error && "status" in err && typeof (err as { status?: number }).status === "number"
      ? (err as { status: number }).status
      : 500;
  console.error(err);
  void logHttpError(req, status >= 400 && status < 600 ? status : 500, message, "INTERNAL_ERROR");
  res.status(status >= 400 && status < 600 ? status : 500).json({
    success: false,
    error: message,
  });
}
