import type { SchoolClass, Subject } from "@uganda-cbc-sms/shared";
import { normalizeClassLevel as normalizeLevel } from "@uganda-cbc-sms/shared";

export type AcademicLevel = "O_LEVEL" | "A_LEVEL";

export const ACADEMIC_LEVELS: AcademicLevel[] = ["O_LEVEL", "A_LEVEL"];

export function levelLabel(level: AcademicLevel | string): string {
  return level === "A_LEVEL" ? "A-Level (UNEB)" : "O-Level (CBC)";
}

export function levelShortLabel(level: AcademicLevel | string): string {
  return level === "A_LEVEL" ? "A-Level" : "O-Level";
}

export function parseAcademicLevel(raw: string | null | undefined): AcademicLevel {
  return normalizeLevel(raw);
}

export function filterClassesByLevel(classes: SchoolClass[], level: AcademicLevel, yearId?: string) {
  return classes.filter(
    (c) => c.level === level && (!yearId || c.academicYearId === yearId),
  );
}

export function filterSubjectsByLevel(subjects: Subject[], level: AcademicLevel) {
  return subjects.filter((s) => s.level === level);
}

export function classDisplayName(c: Pick<SchoolClass, "name" | "stream">): string {
  return c.stream ? `${c.name} · ${c.stream}` : c.name;
}

/** Prefer the active academic year; otherwise the first in the list. */
export function pickDefaultAcademicYear(
  years: Array<{ id: string; isActive?: boolean }>,
): string {
  return years.find((y) => y.isActive)?.id ?? years[0]?.id ?? "";
}

/** Prefer the active term in a year; otherwise the first term. */
export function pickDefaultTerm<T extends { id: string; isActive?: boolean }>(terms: T[]): T | undefined {
  return terms.find((t) => t.isActive) ?? terms[0];
}
