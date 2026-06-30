import { Router } from "express";
import { assessmentSubmitLimiter } from "../../middleware/rateLimiter";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireAssessmentRoles } from "./assessmentAccess";
import * as c from "./assessments.controller";
import * as tr from "./termResults.controller";

export const assessmentsRouter = Router();

assessmentsRouter.use(requireAuth);

assessmentsRouter.use((req, res, next) => {
  if (req.method === "POST") return assessmentSubmitLimiter(req, res, next);
  next();
});

assessmentsRouter.get(
  "/project-work",
  requireAssessmentRoles("subject_teacher", "class_teacher", "admin", "headteacher"),
  asyncHandler(c.getProjectWork),
);
assessmentsRouter.post(
  "/project-work/bulk",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.postProjectWorkBulk),
);

assessmentsRouter.get(
  "/term-results",
  requireAssessmentRoles("admin", "headteacher", "class_teacher", "subject_teacher"),
  asyncHandler(tr.getTermResults),
);
assessmentsRouter.post(
  "/term-results/recalculate",
  requireAssessmentRoles("admin", "headteacher"),
  asyncHandler(tr.recalculateTermResults),
);

assessmentsRouter.get(
  "/cbc/comments",
  requireAssessmentRoles("class_teacher", "headteacher", "admin"),
  asyncHandler(c.getCbcComments),
);
assessmentsRouter.put(
  "/cbc/comments/:studentId",
  requireAssessmentRoles("class_teacher", "headteacher"),
  asyncHandler(c.putCbcComment),
);

assessmentsRouter.get(
  "/alevel",
  requireAssessmentRoles("subject_teacher", "class_teacher", "admin", "headteacher"),
  asyncHandler(c.getAlevel),
);
assessmentsRouter.post(
  "/alevel",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.postAlevel),
);
assessmentsRouter.post(
  "/alevel/bulk",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.postAlevelBulk),
);
assessmentsRouter.post(
  "/alevel/submit",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.submitAlevel),
);
assessmentsRouter.get(
  "/alevel/division",
  requireAssessmentRoles("subject_teacher", "class_teacher", "admin", "headteacher"),
  asyncHandler(c.getAlevelDivision),
);
assessmentsRouter.get(
  "/alevel/comments",
  requireAssessmentRoles("class_teacher", "headteacher", "admin"),
  asyncHandler(c.getAlevelComments),
);
assessmentsRouter.put(
  "/alevel/comments/:studentId",
  requireAssessmentRoles("class_teacher", "headteacher"),
  asyncHandler(c.putAlevelComment),
);
assessmentsRouter.get("/alevel/status", requireAssessmentRoles("headteacher", "admin"), asyncHandler(c.getAlevelStatus));

assessmentsRouter.get(
  "/subjects-assigned",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.getSubjectsAssigned),
);
assessmentsRouter.get("/combinations", asyncHandler(c.getCombinations));
