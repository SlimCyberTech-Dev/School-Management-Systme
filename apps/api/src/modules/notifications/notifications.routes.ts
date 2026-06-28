import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as c from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", asyncHandler(c.list));
notificationsRouter.get("/preferences", asyncHandler(c.getPreferences));
notificationsRouter.patch("/preferences", asyncHandler(c.patchPreferences));
notificationsRouter.patch("/read-all", asyncHandler(c.markAllRead));
notificationsRouter.patch("/:id/read", asyncHandler(c.markRead));
