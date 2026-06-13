import { Router } from "express";
import { requireAuth } from "../../middleware/jwtGuard.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as ctrl from "./onboarding.controller.js";

export const onboardingRouter = Router();

onboardingRouter.use(requireAuth);
onboardingRouter.get("/status", asyncHandler(ctrl.status));
onboardingRouter.patch("/settings", asyncHandler(ctrl.saveSettings));
onboardingRouter.post("/academic-baseline", asyncHandler(ctrl.academicBaseline));
onboardingRouter.post("/classes", asyncHandler(ctrl.classesBatch));
onboardingRouter.post("/grading-scales", asyncHandler(ctrl.seedGradingScales));
onboardingRouter.post("/staff", asyncHandler(ctrl.inviteStaff));
onboardingRouter.post("/skip", asyncHandler(ctrl.skipStep));
onboardingRouter.post("/complete", asyncHandler(ctrl.complete));
