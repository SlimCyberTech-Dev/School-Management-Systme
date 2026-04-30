import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./cbc.controller";

const teachers = requireRoles("subject_teacher", "class_teacher", "admin");
const headteacher = requireRoles("headteacher");

export const cbcRouter = Router();

cbcRouter.use(requireAuth);
cbcRouter.post("/", teachers, asyncHandler(c.postCbc));
cbcRouter.get("/", asyncHandler(c.getCbc));
cbcRouter.patch("/:id/submit", teachers, asyncHandler(c.submit));
cbcRouter.patch("/:id/unlock", headteacher, asyncHandler(c.unlock));
