import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get("/dashboard", asyncHandler(c.dashboard));
analyticsRouter.get("/class-performance", asyncHandler(c.classPerformance));
