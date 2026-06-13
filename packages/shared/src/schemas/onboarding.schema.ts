import { z } from "zod";
import { academicYearSchema, classSchema, termSchema } from "./assessment.schema";

export const onboardingChecklistSchema = z.object({
  passwordChanged: z.boolean(),
  settingsConfigured: z.boolean(),
  academicYearCreated: z.boolean(),
  termCreated: z.boolean(),
  classesCreated: z.boolean(),
  gradingScalesSeeded: z.boolean(),
  staffInvited: z.boolean(),
});

export const onboardingStatusSchema = z.object({
  required: z.boolean(),
  completedAt: z.string().nullable(),
  currentStep: z.number().int().min(1).max(7),
  progressPercent: z.number().int().min(0).max(100),
  checklist: onboardingChecklistSchema,
  skippedSteps: z.array(z.string()),
});

export const onboardingAcademicBaselineSchema = z.object({
  year: academicYearSchema,
  term: termSchema.omit({ academicYearId: true }),
});

export const onboardingClassBatchSchema = z.object({
  academicYearId: z.string().uuid(),
  classes: z
    .array(classSchema.omit({ classTeacherId: true }))
    .min(1)
    .max(24),
});

export const onboardingStaffInviteSchema = z.object({
  invites: z
    .array(
      z.object({
        fullName: z.string().min(2).max(255),
        email: z.string().email(),
        role: z.enum(["headteacher", "bursar", "class_teacher", "subject_teacher"]),
      }),
    )
    .max(5),
});

export const onboardingSkipStepSchema = z.object({
  step: z.enum(["staff_invites", "grading_scales"]),
});

export const tenantCredentialsSchema = z.object({
  signInUrl: z.string().url(),
  adminEmail: z.string().email(),
  temporaryPassword: z.string().min(8),
  schoolName: z.string(),
  slug: z.string(),
});

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;
export type OnboardingAcademicBaselineInput = z.infer<typeof onboardingAcademicBaselineSchema>;
export type OnboardingClassBatchInput = z.infer<typeof onboardingClassBatchSchema>;
export type OnboardingStaffInviteInput = z.infer<typeof onboardingStaffInviteSchema>;
export type TenantCredentials = z.infer<typeof tenantCredentialsSchema>;

export const onboardingSettingsStepSchema = z.object({
  schoolName: z.string().min(1).max(140),
  motto: z.string().max(180).nullish(),
  contactEmail: z.string().email().max(160).nullish(),
  contactPhone: z.string().max(40).nullish(),
  physicalAddress: z.string().max(500).nullish(),
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/).optional(),
  secondaryColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/).optional(),
});

export type OnboardingSettingsStepInput = z.infer<typeof onboardingSettingsStepSchema>;
