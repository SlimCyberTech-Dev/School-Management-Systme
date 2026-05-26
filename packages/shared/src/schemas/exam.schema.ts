import { z } from "zod";

export const EXAM_STATUSES = ["draft", "open", "closed"] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];

export const createExamSchema = z.object({
  name: z.string().min(2, "Exam name must be at least 2 characters").max(200),
  academicYearId: z.string().uuid("Please select a valid academic year"),
  termId: z.string().uuid("Please select a valid term"),
  classId: z.string().uuid("Please select a valid class"),
  examDate: z.string().optional(),
  maxScore: z.coerce.number().min(1, "Maximum score must be at least 1").max(1000).default(100),
  subjectIds: z.array(z.string().uuid()).min(1, "Select at least one subject for this exam"),
});

export const updateExamSchema = z
  .object({
    name: z.string().min(2).max(200).optional(),
    examDate: z.string().nullable().optional(),
    maxScore: z.coerce.number().min(1).max(1000).optional(),
    subjectIds: z.array(z.string().uuid()).min(1).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "No changes were provided" });

export const examMarkItemSchema = z.object({
  studentId: z.string().uuid(),
  score: z.coerce.number().min(0),
});

export const examMarksBulkSchema = z.object({
  subjectId: z.string().uuid("Please select a subject"),
  marks: z.array(examMarkItemSchema).min(1, "Enter at least one mark to save"),
});

export const examMarksSubmitSchema = z.object({
  subjectId: z.string().uuid("Please select a subject"),
});

/** Permanent removal — admin must type the exact exam name. */
export const permanentDeleteExamSchema = z.object({
  confirmName: z.string().min(1, "Type the exam name exactly as shown to confirm permanent deletion"),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ExamMarksBulkInput = z.infer<typeof examMarksBulkSchema>;
