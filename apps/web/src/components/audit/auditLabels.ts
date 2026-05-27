import type { AuditCategory, AuditOutcome, AuditSeverity } from "@uganda-cbc-sms/shared";

export const CATEGORY_LABELS: Record<AuditCategory, string> = {
  auth: "Auth",
  users: "Users",
  students: "Students",
  academic: "Academic",
  assessments: "Assessments",
  exams: "Exams",
  attendance: "Attendance",
  fees: "Fees",
  reports: "Reports",
  timetable: "Timetable",
  system: "System",
};

export function severityTone(severity: AuditSeverity): "neutral" | "success" | "warning" {
  if (severity === "error") return "warning";
  if (severity === "warning") return "warning";
  return "neutral";
}

export function severityClass(severity: AuditSeverity): string {
  if (severity === "error") {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (severity === "warning") {
    return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
  }
  return "bg-muted text-muted-foreground";
}

export function outcomeLabel(outcome: AuditOutcome): string {
  return outcome === "failure" ? "Failed" : "Success";
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
