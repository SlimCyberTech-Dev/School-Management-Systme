import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { invalidateCacheOnMutationMiddleware } from "../../middleware/cacheLayer.js";
import { requireRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./users.controller";
import { userPhotoUpload } from "./users.upload";

const userManagers = requireRoles("admin", "headteacher");

export const usersRouter = Router();

usersRouter.use(invalidateCacheOnMutationMiddleware);

usersRouter.get("/me", requireAuth, asyncHandler(c.me));
usersRouter.patch("/me", requireAuth, asyncHandler(c.updateMe));
usersRouter.post(
  "/me/photo",
  requireAuth,
  userPhotoUpload.single("photo"),
  asyncHandler(c.uploadMyPhoto),
);
usersRouter.post("/", requireAuth, userManagers, asyncHandler(c.create));
usersRouter.get("/", requireAuth, userManagers, asyncHandler(c.list));
usersRouter.post("/bulk/activate", requireAuth, userManagers, asyncHandler(c.bulkActivate));
usersRouter.post("/bulk/deactivate", requireAuth, userManagers, asyncHandler(c.bulkDeactivate));
usersRouter.post("/bulk/delete", requireAuth, userManagers, asyncHandler(c.bulkDelete));
usersRouter.get("/:id", requireAuth, userManagers, asyncHandler(c.getOne));
usersRouter.get("/:id/audit-logs", requireAuth, userManagers, asyncHandler(c.auditLogs));
usersRouter.patch("/:id", requireAuth, userManagers, asyncHandler(c.update));
usersRouter.delete("/:id", requireAuth, userManagers, asyncHandler(c.destroy));
usersRouter.patch("/:id/activate", requireAuth, userManagers, asyncHandler(c.activate));
usersRouter.patch("/:id/deactivate", requireAuth, userManagers, asyncHandler(c.deactivate));
usersRouter.patch("/:id/unlock", requireAuth, userManagers, asyncHandler(c.unlock));
usersRouter.patch("/:id/notes", requireAuth, userManagers, asyncHandler(c.updateNotes));
usersRouter.patch("/:id/reset-password", requireAuth, userManagers, asyncHandler(c.resetPassword));
