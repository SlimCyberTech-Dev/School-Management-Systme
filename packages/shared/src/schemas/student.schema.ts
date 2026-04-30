import { z } from "zod";

export const genderSchema = z.enum(["male", "female"]);

export const studentStatusSchema = z.enum(["active", "transferred", "withdrawn"]);

export const createStudentSchema = z.object({
  fullName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: genderSchema,
  guardianName: z.string().min(1),
  guardianContact: z.string().min(5).max(20),
  classId: z.string().uuid(),
  combinationId: z.string().uuid().optional().nullable(),
});

export const promoteStudentsSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
  targetClassId: z.string().uuid(),
});

export const withdrawStudentSchema = z.object({
  reason: z.string().min(1),
});

export const attendanceSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["present", "absent", "late"]),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type PromoteStudentsInput = z.infer<typeof promoteStudentsSchema>;
export type WithdrawStudentInput = z.infer<typeof withdrawStudentSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
