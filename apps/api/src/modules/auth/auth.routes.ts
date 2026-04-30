import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(c.login));
authRouter.post("/logout", requireAuth, asyncHandler(c.logout));
authRouter.patch("/change-password", requireAuth, asyncHandler(c.changePassword));
