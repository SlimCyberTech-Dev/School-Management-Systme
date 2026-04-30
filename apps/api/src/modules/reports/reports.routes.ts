import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./reports.controller";

const headteacher = requireRoles("headteacher");
const reporters = requireRoles("headteacher", "admin", "class_teacher");

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.post("/cbc/generate", reporters, asyncHandler(c.generateCbc));
reportsRouter.post("/alevel/generate", reporters, asyncHandler(c.generateAlevel));
reportsRouter.patch("/:id/approve", headteacher, asyncHandler(c.approve));
reportsRouter.get("/:id/pdf", asyncHandler(c.getPdf));
