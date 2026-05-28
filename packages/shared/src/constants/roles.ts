export const ROLES = [
  "admin",
  "headteacher",
  "class_teacher",
  "subject_teacher",
  "bursar",
] as const;

export type Role = (typeof ROLES)[number];

/** Roles a headteacher may create, edit, activate, or delete (not admin or other headteachers). */
export const HEADTEACHER_MANAGEABLE_ROLES = ["class_teacher", "subject_teacher", "bursar"] as const;

/** School leadership accounts — only admins manage these via the user module. */
export const PRIVILEGED_USER_ROLES = ["admin", "headteacher"] as const;

/** Both class and subject teachers may enter marks and attendance; class teachers also lead the homeroom class. */
export const CLASS_AND_SUBJECT_TEACHER_ROLES = ["class_teacher", "subject_teacher"] as const;
