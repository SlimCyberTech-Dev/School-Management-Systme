import type { TimetablePeriod } from "@uganda-cbc-sms/shared";
import type { PoolClient } from "pg";
import { query } from "../../config/db";
import { HttpError } from "../../utils/httpError";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function formatPeriodLabel(periods: TimetablePeriod[], periodId: string): string {
  const p = periods.find((x) => x.id === periodId);
  if (!p) return "unknown period";
  return `${p.label} (${p.startTime}–${p.endTime})`;
}

export function formatSlotLabel(
  dayOfWeek: number,
  periodId: string,
  periods: TimetablePeriod[],
): string {
  const day = DAY_NAMES[dayOfWeek] ?? `Day ${dayOfWeek}`;
  return `${day}, ${formatPeriodLabel(periods, periodId)}`;
}

export function formatSlotLabelShort(
  dayOfWeek: number,
  periodId: string,
  periods: TimetablePeriod[],
): string {
  const day = DAY_SHORT[dayOfWeek] ?? `Day ${dayOfWeek}`;
  return `${day} · ${formatPeriodLabel(periods, periodId)}`;
}

type EntryRow = { dayOfWeek: number; periodId: string; classSubjectId: string };

export function findDuplicateClassSlotsInBatch(
  entries: EntryRow[],
  periods: TimetablePeriod[],
): string | null {
  const seen = new Map<string, number>();
  for (const e of entries) {
    const key = `${e.dayOfWeek}:${e.periodId}`;
    if (seen.has(key)) {
      return `This class has two lessons on ${formatSlotLabel(e.dayOfWeek, e.periodId, periods)}. Keep only one subject in that slot.`;
    }
    seen.set(key, 1);
  }
  return null;
}

export async function findTeacherSlotConflict(
  templateId: string,
  classId: string,
  dayOfWeek: number,
  periodId: string,
  teacherId: string,
  periods: TimetablePeriod[],
  client?: PoolClient,
): Promise<string | null> {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run<{
    class_name: string;
    class_stream: string | null;
    subject_code: string;
    teacher_name: string;
  }>(
    `SELECT
       c.name AS class_name,
       c.stream AS class_stream,
       s.code AS subject_code,
       u.full_name AS teacher_name
     FROM timetable_entries e
     JOIN classes c ON c.id = e.class_id
     JOIN class_subjects cs ON cs.id = e.class_subject_id
     JOIN subjects s ON s.id = cs.subject_id
     JOIN users u ON u.id = e.teacher_id
     WHERE e.template_id = $1
       AND e.day_of_week = $2
       AND e.period_id = $3
       AND e.teacher_id = $4
       AND e.class_id <> $5
     LIMIT 1`,
    [templateId, dayOfWeek, periodId, teacherId, classId],
  );

  const hit = rows[0];
  if (!hit) return null;

  const slot = formatSlotLabel(dayOfWeek, periodId, periods);
  const otherClass = hit.class_stream ? `${hit.class_name} ${hit.class_stream}` : hit.class_name;
  return `Schedule clash on ${slot}: ${hit.teacher_name} is already teaching ${otherClass} (${hit.subject_code}) in that period. Pick another slot or change the other class first.`;
}

export async function assertNoScheduleClashes(
  templateId: string,
  classId: string,
  entries: EntryRow[],
  periods: TimetablePeriod[],
  resolveTeacherId: (classSubjectId: string) => Promise<string>,
  client?: PoolClient,
): Promise<void> {
  const dup = findDuplicateClassSlotsInBatch(entries, periods);
  if (dup) throw new HttpError(409, dup);

  for (const e of entries) {
    const teacherId = await resolveTeacherId(e.classSubjectId);
    const msg = await findTeacherSlotConflict(
      templateId,
      classId,
      e.dayOfWeek,
      e.periodId,
      teacherId,
      periods,
      client,
    );
    if (msg) throw new HttpError(409, msg);
  }
}

type PgUniqueError = { code?: string; constraint?: string; detail?: string };

export function messageFromUniqueViolation(
  err: PgUniqueError,
  periods: TimetablePeriod[],
): string | null {
  if (err.code !== "23505") return null;

  const constraint = err.constraint ?? "";
  if (constraint.includes("teacher_slot") || constraint.includes("teacher")) {
    return `Schedule clash: a teacher is already assigned in that period (${describeKeyFromDetail(err.detail, periods)}). Adjust the slot and try again.`;
  }
  if (constraint.includes("class_id") || constraint.includes("timetable_entries")) {
    return `Schedule clash: this class already has a lesson in that period (${describeKeyFromDetail(err.detail, periods)}). Remove the duplicate slot.`;
  }

  return `Schedule clash in ${describeKeyFromDetail(err.detail, periods)}. Adjust the timetable and try again.`;
}

function describeKeyFromDetail(detail: string | undefined, periods: TimetablePeriod[]): string {
  if (!detail) return "one of the selected slots";

  const valuesMatch = detail.match(/\)=\(([^)]+)\)/);
  if (!valuesMatch) return "one of the selected slots";

  const parts = valuesMatch[1].split(",").map((s) => s.trim());
  const dayOfWeek = parts.length > 1 ? Number(parts[1]) : NaN;
  const periodId = parts.length > 2 ? parts[2] : undefined;

  if (Number.isFinite(dayOfWeek) && periodId && /^[0-9a-f-]{36}$/i.test(periodId)) {
    return formatSlotLabelShort(dayOfWeek, periodId, periods);
  }
  if (Number.isFinite(dayOfWeek)) {
    return DAY_NAMES[dayOfWeek] ?? `day ${dayOfWeek}`;
  }

  return "one of the selected slots";
}

export function validationClashMessage(
  kind: "class" | "teacher",
  dayOfWeek: number,
  periodId: string,
  periods: TimetablePeriod[],
): string {
  const slot = formatSlotLabel(dayOfWeek, periodId, periods);
  if (kind === "class") {
    return `Class double-booked on ${slot} — two lessons are assigned to the same class in one period.`;
  }
  return `Teacher double-booked on ${slot} — the same teacher is assigned to two classes in one period.`;
}
