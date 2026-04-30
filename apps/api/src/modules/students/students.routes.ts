import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./students.controller";
import { studentPhotoUpload } from "./students.upload";

const admin = requireRoles("admin");

export const studentsRouter = Router();

studentsRouter.use(requireAuth);

studentsRouter.get("/search", asyncHandler(c.search));
studentsRouter.post("/", admin, asyncHandler(c.create));
studentsRouter.get("/", asyncHandler(c.list));
studentsRouter.post("/promote", admin, asyncHandler(c.promote));
studentsRouter.get("/:id", asyncHandler(c.getOne));
studentsRouter.post(
  "/:id/photo",
  admin,
  studentPhotoUpload.single("photo"),
  asyncHandler(c.uploadPhoto),
);
studentsRouter.patch("/:id/withdraw", admin, asyncHandler(c.withdraw));
