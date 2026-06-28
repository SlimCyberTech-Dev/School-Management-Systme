import type { Request, Response } from "express";
import { z } from "zod";
import { NOTIFICATION_CATEGORIES } from "../../services/notifications/categories.js";
import * as svc from "./notifications.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

const patchPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        category: z.enum(NOTIFICATION_CATEGORIES),
        emailEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
      }),
    )
    .min(1),
});

export async function list(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const data = await svc.listNotifications(req.user!.id, {
    page: query.page,
    limit: query.limit,
    unreadOnly: query.unread,
  });
  res.json({ success: true, data });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const row = await svc.markNotificationRead(req.user!.id, req.params["id"]!);
  res.json({ success: true, data: row });
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  const data = await svc.markAllNotificationsRead(req.user!.id);
  res.json({ success: true, data });
}

export async function getPreferences(req: Request, res: Response): Promise<void> {
  const data = await svc.getNotificationPreferences(req.user!.id);
  res.json({ success: true, data });
}

export async function patchPreferences(req: Request, res: Response): Promise<void> {
  const body = patchPreferencesSchema.parse(req.body);
  const tenantId = req.tenant?.id ?? req.user!.tenantId;
  if (!tenantId) {
    res.status(400).json({
      success: false,
      error: "School context is required.",
      code: "TENANT_REQUIRED",
    });
    return;
  }
  const data = await svc.updateNotificationPreferences(req.user!.id, tenantId, body.preferences);
  res.json({ success: true, data });
}
