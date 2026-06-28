/** Preference categories wired in v1 event hooks. */
export const NOTIFICATION_CATEGORIES = [
  "assessment_submitted",
  "competency_override",
  "exam_marks_submitted",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  assessment_submitted: "Competency ratings submitted",
  competency_override: "Headteacher competency override",
  exam_marks_submitted: "Exam marks submitted",
};

export function isNotificationCategory(value: string): value is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}
