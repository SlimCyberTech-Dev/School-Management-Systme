import type { Response } from "express";
import {
  changePasswordSchema,
  loginSchema,
} from "@uganda-cbc-sms/shared";
import type { Request } from "express";
import * as authService from "./auth.service";

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body);
  res.json({ success: true, data: result });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: { message: "Logged out" } });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  const body = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user.id, body);
  res.json({ success: true, data: { message: "Password updated" } });
}
