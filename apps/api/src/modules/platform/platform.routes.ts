import { Router } from "express";
import { requirePlatformAuth } from "../../middleware/platformAuth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as ctrl from "./platform.controller.js";
import * as billingCtrl from "./platformBilling.controller.js";

export const platformRouter = Router();

platformRouter.post("/auth/login", asyncHandler(ctrl.login));
platformRouter.post("/billing/webhooks/flutterwave", asyncHandler(billingCtrl.flutterwaveWebhook));

platformRouter.use(asyncHandler(requirePlatformAuth));
platformRouter.post("/auth/logout", asyncHandler(ctrl.logout));
platformRouter.get("/auth/me", asyncHandler(ctrl.me));
platformRouter.patch("/auth/change-password", asyncHandler(ctrl.changePassword));
platformRouter.get("/admins", asyncHandler(ctrl.listAdmins));
platformRouter.post("/admins", asyncHandler(ctrl.createAdmin));
platformRouter.post("/admins/:id/deactivate", asyncHandler(ctrl.deactivateAdmin));
platformRouter.get("/tenants", asyncHandler(ctrl.listTenants));
platformRouter.get("/audit-log", asyncHandler(ctrl.listAuditLog));
platformRouter.post("/tenants", asyncHandler(ctrl.createTenant));
platformRouter.patch("/tenants/:id", asyncHandler(ctrl.patchTenant));
platformRouter.post("/tenants/:id/suspend", asyncHandler(ctrl.suspendTenant));
platformRouter.post("/tenants/:id/activate", asyncHandler(ctrl.activateTenant));
platformRouter.post("/tenants/:id/reset-admin-password", asyncHandler(ctrl.resetAdminPassword));
platformRouter.get("/billing/overview", asyncHandler(billingCtrl.billingOverview));
platformRouter.get("/billing/settings", asyncHandler(billingCtrl.billingSettings));
platformRouter.patch("/billing/settings", asyncHandler(billingCtrl.patchBillingSettings));
platformRouter.post("/billing/periods", asyncHandler(billingCtrl.createPeriod));
platformRouter.patch("/billing/periods/:id", asyncHandler(billingCtrl.patchPeriod));
platformRouter.post("/billing/run-overdue", asyncHandler(billingCtrl.runOverdue));
