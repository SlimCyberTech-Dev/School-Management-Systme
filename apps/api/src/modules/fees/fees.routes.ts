import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./fees.controller";

const admin = requireRoles("admin");
const bursarTeam = requireRoles("bursar", "admin");

export const feesRouter = Router();

feesRouter.use(requireAuth);

feesRouter.post("/structure", admin, asyncHandler(c.postStructure));
feesRouter.get("/structure", asyncHandler(c.getStructure));
feesRouter.post("/invoices", bursarTeam, asyncHandler(c.postInvoice));
feesRouter.get("/invoices", asyncHandler(c.getInvoices));
feesRouter.post("/payments", bursarTeam, asyncHandler(c.postPayment));
feesRouter.get("/payments", asyncHandler(c.getPayments));
feesRouter.get("/balance/:studentId", asyncHandler(c.getBalance));
feesRouter.get("/reports", asyncHandler(c.getReports));
