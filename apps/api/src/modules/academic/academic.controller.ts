import type { Request, Response } from "express";
import * as sharedSchemas from "@uganda-cbc-sms/shared";
import * as svc from "./academic.service";

const {
  academicYearSchema,
  classSchema,
  classSubjectSchema,
  combinationSchema,
  cbcStrandSchema,
  subjectSchema,
  termSchema,
  updateAcademicYearSchema,
  updateClassSchema,
  updateSubjectSchema,
  updateTermSchema,
} = sharedSchemas;

export async function postYear(req: Request, res: Response): Promise<void> {
  const body = academicYearSchema.parse(req.body);
  const row = await svc.createAcademicYear(body);
  res.status(201).json({ success: true, data: row });
}

export async function getYears(_req: Request, res: Response): Promise<void> {
  const rows = await svc.listAcademicYears();
  res.json({ success: true, data: rows });
}

export async function patchYear(req: Request, res: Response): Promise<void> {
  const body = updateAcademicYearSchema.parse(req.body);
  const row = await svc.updateAcademicYear(req.params["id"]!, body);
  res.json({ success: true, data: row });
}

export async function deleteYear(req: Request, res: Response): Promise<void> {
  await svc.deleteAcademicYear(req.params["id"]!);
  res.json({ success: true, data: { deleted: true } });
}

export async function postTerm(req: Request, res: Response): Promise<void> {
  const body = termSchema.parse(req.body);
  const row = await svc.createTerm(body);
  res.status(201).json({ success: true, data: row });
}

export async function getTerms(_req: Request, res: Response): Promise<void> {
  const rows = await svc.listTerms();
  res.json({ success: true, data: rows });
}

export async function patchTerm(req: Request, res: Response): Promise<void> {
  const body = updateTermSchema.parse(req.body);
  const row = await svc.updateTerm(req.params["id"]!, body);
  res.json({ success: true, data: row });
}

export async function deleteTerm(req: Request, res: Response): Promise<void> {
  await svc.deleteTerm(req.params["id"]!);
  res.json({ success: true, data: { deleted: true } });
}

export async function postClass(req: Request, res: Response): Promise<void> {
  const body = classSchema.parse(req.body);
  const row = await svc.createClass(body);
  res.status(201).json({ success: true, data: row });
}

export async function getClasses(_req: Request, res: Response): Promise<void> {
  const rows = await svc.listClasses();
  res.json({ success: true, data: rows });
}

export async function patchClass(req: Request, res: Response): Promise<void> {
  const body = updateClassSchema.parse(req.body);
  const row = await svc.updateClass(req.params["id"]!, body);
  res.json({ success: true, data: row });
}

export async function deleteClass(req: Request, res: Response): Promise<void> {
  await svc.deleteClass(req.params["id"]!);
  res.json({ success: true, data: { deleted: true } });
}

export async function postSubject(req: Request, res: Response): Promise<void> {
  const body = subjectSchema.parse(req.body);
  const row = await svc.createSubject(body);
  res.status(201).json({ success: true, data: row });
}

export async function getSubjects(_req: Request, res: Response): Promise<void> {
  const rows = await svc.listSubjects();
  res.json({ success: true, data: rows });
}

export async function patchSubject(req: Request, res: Response): Promise<void> {
  const body = updateSubjectSchema.parse(req.body);
  const row = await svc.updateSubject(req.params["id"]!, body);
  res.json({ success: true, data: row });
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  await svc.deleteSubject(req.params["id"]!);
  res.json({ success: true, data: { deleted: true } });
}

export async function postClassSubject(req: Request, res: Response): Promise<void> {
  const body = classSubjectSchema.parse(req.body);
  const row = await svc.createClassSubject(body);
  res.status(201).json({ success: true, data: row });
}

export async function postCombination(req: Request, res: Response): Promise<void> {
  const body = combinationSchema.parse(req.body);
  const row = await svc.createCombination(body);
  res.status(201).json({ success: true, data: row });
}

export async function getCombinations(_req: Request, res: Response): Promise<void> {
  const rows = await svc.listCombinations();
  res.json({ success: true, data: rows });
}

export async function postCbcStrand(req: Request, res: Response): Promise<void> {
  const body = cbcStrandSchema.parse(req.body);
  const row = await svc.createCbcStrand(body);
  res.status(201).json({ success: true, data: row });
}

export async function getCbcStrands(req: Request, res: Response): Promise<void> {
  const subjectId = req.query.subjectId as string | undefined;
  const rows = await svc.listCbcStrands(subjectId);
  res.json({ success: true, data: rows });
}
