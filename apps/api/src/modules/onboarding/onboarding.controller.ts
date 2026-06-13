import type { Request, Response } from "express";
import {
  onboardingAcademicBaselineSchema,
  onboardingClassBatchSchema,
  onboardingSettingsStepSchema,
  onboardingSkipStepSchema,
  onboardingStaffInviteSchema,
} from "@uganda-cbc-sms/shared";
import { HttpError } from "../../utils/httpError.js";
import * as svc from "./onboarding.service.js";

function requireAdmin(req: Request): void {
  if (!req.user) throw new HttpError(401, "Sign in required.");
  if (req.user.role !== "admin") {
    throw new HttpError(403, "Only school administrators can run setup.");
  }
}

export async function status(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Sign in required." });
    return;
  }
  const data = await svc.getOnboardingStatus(req.user.tenantId, req.user.id, req.user.role);
  res.json({ success: true, data });
}

export async function saveSettings(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const body = onboardingSettingsStepSchema.parse(req.body);
  await svc.saveSettingsStep(req.user!.tenantId, req.user!.id, body);
  res.json({ success: true, message: "School profile saved." });
}

export async function academicBaseline(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const body = onboardingAcademicBaselineSchema.parse(req.body);
  const data = await svc.saveAcademicBaseline(body);
  res.json({ success: true, data, message: "Academic year and term created." });
}

export async function classesBatch(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const body = onboardingClassBatchSchema.parse(req.body);
  const created = await svc.saveClassesBatch(body);
  res.json({ success: true, data: { created }, message: `${created} class(es) created.` });
}

export async function seedGradingScales(_req: Request, res: Response): Promise<void> {
  requireAdmin(_req);
  const inserted = await svc.seedGradingScalesStep();
  res.json({
    success: true,
    data: { inserted },
    message: "Default grading scales are ready.",
  });
}

export async function inviteStaff(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const body = onboardingStaffInviteSchema.parse(req.body);
  const credentials = await svc.inviteStaffStep(req.user!.tenantId, body);
  res.json({ success: true, data: { credentials }, message: "Staff invitations created." });
}

export async function skipStep(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const body = onboardingSkipStepSchema.parse(req.body);
  await svc.skipOnboardingStep(req.user!.tenantId, body.step);
  res.json({ success: true, message: "Step skipped." });
}

export async function complete(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  await svc.completeOnboarding(req.user!.tenantId, req.user!.id, req.user!.role);
  res.json({ success: true, message: "School setup complete." });
}
