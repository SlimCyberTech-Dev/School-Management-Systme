import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./audit.controller";

const admin = requireRoles("admin");

export const auditRouter = Router();

auditRouter.get("/", requireAuth, admin, asyncHandler(c.list));
auditRouter.get("/stats", requireAuth, admin, asyncHandler(c.stats));
auditRouter.post("/archive", requireAuth, admin, asyncHandler(c.archive));
auditRouter.delete("/", requireAuth, admin, asyncHandler(c.remove));
