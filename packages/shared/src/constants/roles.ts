export const ROLES = [
  "admin",
  "headteacher",
  "class_teacher",
  "subject_teacher",
  "bursar",
] as const;

export type Role = (typeof ROLES)[number];
