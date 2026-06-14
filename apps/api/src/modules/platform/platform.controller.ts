import type { Request, Response } from "express";
import {
  changePasswordSchema,
  createPlatformAdminSchema,
  createTenantSchema,
  platformLoginSchema,
  updateTenantSchema,
} from "@uganda-cbc-sms/shared";
import { HttpError } from "../../utils/httpError.js";
import * as adminSvc from "./platformAdmin.service.js";
import * as authSvc from "./platformAuth.service.js";
import * as svc from "./platform.service.js";

export async function login(req: Request, res: Response): Promise<void> {
  const body = platformLoginSchema.parse(req.body);
  const data = await authSvc.platformLogin(body, {
    ipAddress: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
    deviceInfo: req.headers["sec-ch-ua-platform"]?.toString() ?? null,
  });
  res.json({ success: true, data, message: "Platform sign-in successful." });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  await authSvc.platformLogout(req.platformAdmin.sessionId, bearer);
  res.json({ success: true, data: null, message: "Signed out." });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const data = await authSvc.getPlatformAdminProfile(req.platformAdmin.id);
  res.json({ success: true, data });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const body = changePasswordSchema.parse(req.body);
  const data = await authSvc.platformChangePassword(
    req.platformAdmin.id,
    body,
    req.platformAdmin.sessionId,
  );
  res.json({ success: true, data, message: "Password updated." });
}

export async function listAdmins(_req: Request, res: Response): Promise<void> {
  const data = await adminSvc.listPlatformAdmins();
  res.json({ success: true, data });
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const body = createPlatformAdminSchema.parse(req.body);
  const data = await adminSvc.createPlatformAdmin(body, req.platformAdmin.id);
  res.status(201).json({
    success: true,
    data,
    message: data.temporaryPassword
      ? "Operator created. Share the temporary password securely — it is shown once."
      : "Operator created.",
  });
}

export async function deactivateAdmin(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const id = req.params["id"];
  if (!id) throw new HttpError(400, "Operator id is required.");
  const data = await adminSvc.deactivatePlatformAdmin(id, req.platformAdmin.id);
  res.json({ success: true, data, message: `${data.fullName} has been deactivated.` });
}

export async function listTenants(_req: Request, res: Response): Promise<void> {
  const data = await svc.listTenants();
  res.json({ success: true, data });
}

export async function createTenant(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const body = createTenantSchema.parse(req.body);
  const data = await svc.createTenant(body, req.platformAdmin.id);
  res.status(201).json({
    success: true,
    data,
    message: `School "${data.displayName}" created. Share the sign-in credentials with the school admin.`,
  });
}

export async function patchTenant(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const id = req.params["id"];
  if (!id) throw new HttpError(400, "Tenant id is required.");
  const body = updateTenantSchema.parse(req.body);
  const data = await svc.updateTenant(id, body, req.platformAdmin.id);
  res.json({ success: true, data, message: "Tenant updated." });
}

export async function listAuditLog(_req: Request, res: Response): Promise<void> {
  const data = await svc.listPlatformAuditLog(100);
  res.json({ success: true, data });
}

export async function resetAdminPassword(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const id = req.params["id"];
  if (!id) throw new HttpError(400, "Tenant id is required.");
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters.");
  }
  await svc.resetTenantAdminPassword(id, password, req.platformAdmin.id);
  res.json({ success: true, data: null, message: "School admin password reset." });
}

export async function suspendTenant(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const id = req.params["id"];
  if (!id) throw new HttpError(400, "Tenant id is required.");
  const data = await svc.suspendTenant(id, req.platformAdmin.id);
  res.json({
    success: true,
    data,
    message: `${data.displayName} has been suspended. All sign-in is blocked until you reactivate the school.`,
  });
}

export async function activateTenant(req: Request, res: Response): Promise<void> {
  if (!req.platformAdmin) throw new HttpError(401, "Platform sign-in required.");
  const id = req.params["id"];
  if (!id) throw new HttpError(400, "Tenant id is required.");
  const data = await svc.activateTenant(id, req.platformAdmin.id);
  res.json({
    success: true,
    data,
    message: `${data.displayName} is active again. Staff can sign in normally.`,
  });
}
