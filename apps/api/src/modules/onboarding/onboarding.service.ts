import type {
  OnboardingAcademicBaselineInput,
  OnboardingClassBatchInput,
  OnboardingSettingsStepInput,
  OnboardingStaffInviteInput,
  OnboardingStatus,
} from "@uganda-cbc-sms/shared";
import bcrypt from "bcrypt";
import { query } from "../../config/db.js";
import { loadEnv } from "../../config/env.js";
import { HttpError } from "../../utils/httpError.js";
import { generateTemporaryPassword } from "../../utils/generatePassword.js";
import { createAcademicYear, createClass, createTerm } from "../academic/academic.service.js";
import { seedDefaultGradingScales } from "../academic/gradingScaleMaintenance.js";
import { updateSchoolSettings } from "../settings/settings.service.js";

type OnboardingJson = {
  completedAt?: string | null;
  skippedSteps?: string[];
  staffInvited?: boolean;
  profileStepCompleted?: boolean;
};

const DEFAULT_SCHOOL_NAME = "Uganda CBC SMS School";
const DEFAULT_MOTTO = "Learning with purpose";

function defaultOnboarding(): OnboardingJson {
  return { skippedSteps: [], staffInvited: false, completedAt: null };
}

function parseOnboarding(raw: unknown): OnboardingJson {
  if (!raw || typeof raw !== "object") return defaultOnboarding();
  const o = raw as Record<string, unknown>;
  return {
    completedAt: typeof o.completedAt === "string" ? o.completedAt : null,
    skippedSteps: Array.isArray(o.skippedSteps)
      ? o.skippedSteps.filter((s): s is string => typeof s === "string")
      : [],
    staffInvited: Boolean(o.staffInvited),
    profileStepCompleted: Boolean(o.profileStepCompleted),
  };
}

async function loadOnboardingRow(tenantId: string): Promise<OnboardingJson> {
  const { rows } = await query<{ onboarding: unknown }>(
    `SELECT onboarding FROM tenant_settings WHERE tenant_id = $1`,
    [tenantId],
  );
  return parseOnboarding(rows[0]?.onboarding);
}

async function saveOnboarding(tenantId: string, patch: Partial<OnboardingJson>): Promise<void> {
  const current = await loadOnboardingRow(tenantId);
  const next: OnboardingJson = {
    ...current,
    ...patch,
    skippedSteps: patch.skippedSteps ?? current.skippedSteps ?? [],
  };
  await query(
    `UPDATE tenant_settings SET onboarding = $2::jsonb, updated_at = NOW() WHERE tenant_id = $1`,
    [tenantId, JSON.stringify(next)],
  );
}

async function buildChecklist(tenantId: string, userId: string, onboarding: OnboardingJson) {
  const [userRow, settingsRow, counts] = await Promise.all([
    query<{ force_password_change: boolean | null }>(
      `SELECT force_password_change FROM users WHERE id = $1`,
      [userId],
    ),
    query<{
      school_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      logo_url: string | null;
      motto: string | null;
      physical_address: string | null;
    }>(`SELECT school_name, contact_email, contact_phone, logo_url, motto, physical_address FROM tenant_settings WHERE tenant_id = $1`, [
      tenantId,
    ]),
    query<{
      years: string;
      terms: string;
      classes: string;
      scales: string;
      staff: string;
    }>(
      `SELECT
         (SELECT COUNT(*)::text FROM academic_years) AS years,
         (SELECT COUNT(*)::text FROM terms) AS terms,
         (SELECT COUNT(*)::text FROM classes) AS classes,
         (SELECT COUNT(*)::text FROM assessment_grading_scales WHERE is_active) AS scales,
         (SELECT COUNT(*)::text FROM users WHERE deleted_at IS NULL AND role <> 'admin') AS staff`,
    ),
  ]);

  const settings = settingsRow.rows[0];
  const settingsConfigured = Boolean(
    onboarding.profileStepCompleted ||
      settings?.contact_email?.trim() ||
      settings?.contact_phone?.trim() ||
      settings?.logo_url?.trim() ||
      settings?.physical_address?.trim() ||
      (settings?.school_name?.trim() &&
        settings.school_name.trim() !== DEFAULT_SCHOOL_NAME) ||
      (settings?.motto?.trim() && settings.motto !== DEFAULT_MOTTO),
  );

  const passwordChanged = !userRow.rows[0]?.force_password_change;
  const academicYearCreated = Number(counts.rows[0]?.years ?? 0) > 0;
  const termCreated = Number(counts.rows[0]?.terms ?? 0) > 0;
  const classesCreated = Number(counts.rows[0]?.classes ?? 0) > 0;
  const gradingScalesSeeded =
    Number(counts.rows[0]?.scales ?? 0) > 0 ||
    (onboarding.skippedSteps ?? []).includes("grading_scales");
  const staffInvited =
    Boolean(onboarding.staffInvited) ||
    Number(counts.rows[0]?.staff ?? 0) > 0 ||
    (onboarding.skippedSteps ?? []).includes("staff_invites");

  return {
    passwordChanged,
    settingsConfigured,
    academicYearCreated,
    termCreated,
    classesCreated,
    gradingScalesSeeded,
    staffInvited,
  };
}

function computeProgress(checklist: OnboardingStatus["checklist"], forcePassword: boolean): number {
  const weights = [
    forcePassword ? !checklist.passwordChanged : false,
    !checklist.settingsConfigured,
    !checklist.academicYearCreated,
    !checklist.termCreated,
    !checklist.classesCreated,
    !checklist.gradingScalesSeeded,
  ].filter(Boolean).length;

  const totalSteps = 6;
  const done = totalSteps - weights;
  return Math.round((done / totalSteps) * 100);
}

function resolveCurrentStep(
  checklist: OnboardingStatus["checklist"],
  forcePassword: boolean,
): number {
  if (forcePassword && !checklist.passwordChanged) return 1;
  if (!checklist.settingsConfigured) return 2;
  if (!checklist.academicYearCreated || !checklist.termCreated) return 3;
  if (!checklist.classesCreated) return 4;
  if (!checklist.gradingScalesSeeded) return 5;
  if (!checklist.staffInvited) return 6;
  return 7;
}

export async function getOnboardingStatus(
  tenantId: string,
  userId: string,
  role: string,
): Promise<OnboardingStatus> {
  const onboarding = await loadOnboardingRow(tenantId);
  const checklist = await buildChecklist(tenantId, userId, onboarding);
  const { rows } = await query<{ force_password_change: boolean | null }>(
    `SELECT force_password_change FROM users WHERE id = $1`,
    [userId],
  );
  const forcePassword = Boolean(rows[0]?.force_password_change);
  const completedAt = onboarding.completedAt ?? null;
  const required = role === "admin" && !completedAt;

  return {
    required,
    completedAt,
    currentStep: resolveCurrentStep(checklist, forcePassword),
    progressPercent: completedAt ? 100 : computeProgress(checklist, forcePassword),
    checklist,
    skippedSteps: onboarding.skippedSteps ?? [],
  };
}

export async function saveSettingsStep(
  tenantId: string,
  userId: string,
  input: OnboardingSettingsStepInput,
): Promise<void> {
  await updateSchoolSettings(input, userId, tenantId);
  await saveOnboarding(tenantId, { profileStepCompleted: true });
}

export async function saveAcademicBaseline(
  input: OnboardingAcademicBaselineInput,
): Promise<{ yearId: string; termId: string }> {
  const year = await createAcademicYear(input.year);
  const term = await createTerm({
    ...input.term,
    academicYearId: year.id,
  });
  return { yearId: year.id, termId: term.id };
}

export async function saveClassesBatch(input: OnboardingClassBatchInput): Promise<number> {
  let created = 0;
  for (const row of input.classes) {
    await createClass({
      name: row.name,
      stream: row.stream,
      level: row.level,
      academicYearId: input.academicYearId,
      classTeacherId: null,
    });
    created += 1;
  }
  return created;
}

export async function seedGradingScalesStep(): Promise<number> {
  const result = await seedDefaultGradingScales({ levels: ["O_LEVEL", "A_LEVEL"] });
  return result.inserted;
}

export async function inviteStaffStep(
  tenantId: string,
  input: OnboardingStaffInviteInput,
): Promise<
  Array<{ fullName: string; email: string; role: string; temporaryPassword: string }>
> {
  const env = loadEnv();
  const credentials: Array<{
    fullName: string;
    email: string;
    role: string;
    temporaryPassword: string;
  }> = [];

  for (const invite of input.invites) {
    const temporaryPassword = generateTemporaryPassword();
    const hash = await bcrypt.hash(temporaryPassword, env.BCRYPT_ROUNDS);
    const email = invite.email.toLowerCase().trim();
    await query(
      `INSERT INTO users (tenant_id, full_name, email, password_hash, role, is_active, force_password_change)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
       ON CONFLICT (tenant_id, email)
       DO UPDATE SET
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         password_hash = EXCLUDED.password_hash,
         force_password_change = TRUE,
         is_active = TRUE,
         updated_at = NOW()`,
      [tenantId, invite.fullName.trim(), email, hash, invite.role],
    );
    credentials.push({
      fullName: invite.fullName.trim(),
      email,
      role: invite.role,
      temporaryPassword,
    });
  }

  await saveOnboarding(tenantId, { staffInvited: true });
  return credentials;
}

export async function skipOnboardingStep(
  tenantId: string,
  step: "staff_invites" | "grading_scales",
): Promise<void> {
  const current = await loadOnboardingRow(tenantId);
  const skipped = new Set(current.skippedSteps ?? []);
  skipped.add(step);
  const patch: Partial<OnboardingJson> = { skippedSteps: [...skipped] };
  if (step === "staff_invites") {
    patch.staffInvited = true;
  }
  await saveOnboarding(tenantId, patch);
}

export async function completeOnboarding(tenantId: string, userId: string, role: string): Promise<void> {
  const status = await getOnboardingStatus(tenantId, userId, role);
  if (!status.checklist.passwordChanged) {
    throw new HttpError(400, "Change your password before finishing setup.");
  }
  if (!status.checklist.settingsConfigured) {
    throw new HttpError(400, "Complete school profile before finishing setup.");
  }
  if (!status.checklist.academicYearCreated || !status.checklist.termCreated) {
    throw new HttpError(400, "Set up the academic year and term before finishing.");
  }
  if (!status.checklist.classesCreated) {
    throw new HttpError(400, "Add at least one class before finishing setup.");
  }

  await saveOnboarding(tenantId, { completedAt: new Date().toISOString() });
}

export function buildSignInUrl(slug: string): string {
  const env = loadEnv();
  const root = env.APP_ROOT_DOMAIN || "localhost";
  const port = process.env.WEB_PORT || process.env.PORT_WEB || "3000";
  if (root === "localhost") {
    return `http://${slug}.localhost:${port}/login`;
  }
  return `https://${slug}.${root}/login`;
}
