import { z } from "zod";

export const cbcRatingSchema = z.enum(["A", "B", "C", "D"]);

export const cbcScoreUpsertSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  strandId: z.string().uuid(),
  termId: z.string().uuid(),
  competency: z.string().min(1),
  rating: cbcRatingSchema,
});

export const cbcScoresBulkSchema = z.object({
  items: z.array(cbcScoreUpsertSchema).min(1),
});

export const alevelScoreUpsertSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  termId: z.string().uuid(),
  score: z.coerce.number().min(0).max(100),
});

export const cbcReportGenerateSchema = z.object({
  classId: z.string().uuid(),
  termId: z.string().uuid(),
});

export const alevelReportGenerateSchema = z.object({
  classId: z.string().uuid(),
  termId: z.string().uuid(),
});

export const academicYearSchema = z.object({
  name: z.string().min(1).max(50),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isActive: z.boolean().optional(),
});

export const termSchema = z.object({
  academicYearId: z.string().uuid(),
  termNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isActive: z.boolean().optional(),
});

export const classSchema = z.object({
  name: z.string().min(1).max(10),
  stream: z.string().min(1).max(20),
  level: z.enum(["o_level", "a_level"]),
  academicYearId: z.string().uuid(),
  classTeacherId: z.string().uuid().optional().nullable(),
});

export const subjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  level: z.enum(["o_level", "a_level"]),
});

export const classSubjectSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional().nullable(),
});

export const combinationSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  subjects: z.array(z.string().uuid()).min(1),
});

/** CBC strand definition (admin creates strands for subjects) */
export const cbcStrandSchema = z.object({
  subjectId: z.string().uuid(),
  strandName: z.string().min(1).max(100),
  competencies: z.array(z.string().min(1)).min(1),
});

export type CbcScoreUpsertInput = z.infer<typeof cbcScoreUpsertSchema>;
export type AlevelScoreUpsertInput = z.infer<typeof alevelScoreUpsertSchema>;
