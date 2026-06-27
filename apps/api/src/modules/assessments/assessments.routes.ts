import { Router } from "express";
import { assessmentSubmitLimiter } from "../../middleware/rateLimiter";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireAssessmentRoles } from "./assessmentAccess";
import * as c from "./assessments.controller";
import * as cc from "./cbcCompetency.controller";

export const assessmentsRouter = Router();

assessmentsRouter.use(requireAuth);

assessmentsRouter.use((req, res, next) => {
  if (req.method === "POST") return assessmentSubmitLimiter(req, res, next);
  next();
});

assessmentsRouter.get(
  "/cbc",
  requireAssessmentRoles("subject_teacher", "class_teacher", "admin", "headteacher"),
  asyncHandler(c.getCbc),
);
assessmentsRouter.post(
  "/cbc",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.postCbc),
);
assessmentsRouter.post(
  "/cbc/bulk",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.postCbcBulk),
);
assessmentsRouter.post(
  "/cbc/submit",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.submitCbc),
);
assessmentsRouter.patch("/cbc/unlock", requireAssessmentRoles("headteacher"), asyncHandler(c.unlockCbc));
assessmentsRouter.get(
  "/cbc/project",
  requireAssessmentRoles("subject_teacher", "class_teacher", "admin"),
  asyncHandler(c.getCbcProject),
);
assessmentsRouter.post(
  "/cbc/project",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.postCbcProject),
);
assessmentsRouter.put(
  "/cbc/project/:id",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(c.putCbcProject),
);
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
  "/cbc/comments",
  requireAssessmentRoles("class_teacher", "headteacher", "admin"),
  asyncHandler(c.getCbcComments),
);
assessmentsRouter.put(
  "/cbc/comments/:studentId",
  requireAssessmentRoles("class_teacher", "headteacher"),
  asyncHandler(c.putCbcComment),
);
assessmentsRouter.get("/cbc/status", requireAssessmentRoles("headteacher", "admin"), asyncHandler(c.getCbcStatus));

assessmentsRouter.post(
  "/cbc/activities",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(cc.postCbcActivity),
);
assessmentsRouter.patch(
  "/cbc/activities/:id/lock",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(cc.patchCbcActivityLock),
);
assessmentsRouter.post(
  "/cbc/ratings",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(cc.postCbcRatings),
);
assessmentsRouter.get(
  "/cbc/term-summary",
  requireAssessmentRoles("subject_teacher", "class_teacher", "admin", "headteacher"),
  asyncHandler(cc.getCbcTermSummary),
);
assessmentsRouter.patch(
  "/cbc/term-summary/:id/override",
  requireAssessmentRoles("headteacher"),
  asyncHandler(cc.patchCbcTermSummaryOverride),
);
assessmentsRouter.post(
  "/cbc/learning-outcomes",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(cc.postCbcLearningOutcome),
);
assessmentsRouter.post(
  "/cbc/learning-outcome-records",
  requireAssessmentRoles("subject_teacher", "class_teacher"),
  asyncHandler(cc.postCbcLearningOutcomeRecord),
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
assessmentsRouter.get("/strands", asyncHandler(c.getStrands));
assessmentsRouter.get("/combinations", asyncHandler(c.getCombinations));
