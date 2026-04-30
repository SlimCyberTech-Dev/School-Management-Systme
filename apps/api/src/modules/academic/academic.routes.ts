import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import * as c from "./academic.controller";

export const academicRouter = Router();

academicRouter.use(requireAuth);

academicRouter.post("/years", asyncHandler(c.postYear));
academicRouter.get("/years", asyncHandler(c.getYears));
academicRouter.post("/terms", asyncHandler(c.postTerm));
academicRouter.get("/terms", asyncHandler(c.getTerms));
academicRouter.post("/classes", asyncHandler(c.postClass));
academicRouter.get("/classes", asyncHandler(c.getClasses));
academicRouter.post("/subjects", asyncHandler(c.postSubject));
academicRouter.get("/subjects", asyncHandler(c.getSubjects));
academicRouter.post("/class-subjects", asyncHandler(c.postClassSubject));
academicRouter.post("/combinations", asyncHandler(c.postCombination));
academicRouter.get("/combinations", asyncHandler(c.getCombinations));
academicRouter.post("/cbc-strands", asyncHandler(c.postCbcStrand));
academicRouter.get("/cbc-strands", asyncHandler(c.getCbcStrands));
