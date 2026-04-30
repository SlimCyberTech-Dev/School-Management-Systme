import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./users.controller";

const admin = requireRoles("admin");

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, asyncHandler(c.me));
usersRouter.post("/", requireAuth, admin, asyncHandler(c.create));
usersRouter.get("/", requireAuth, admin, asyncHandler(c.list));
usersRouter.patch("/:id/deactivate", requireAuth, admin, asyncHandler(c.deactivate));
usersRouter.patch("/:id/reset-password", requireAuth, admin, asyncHandler(c.resetPassword));
