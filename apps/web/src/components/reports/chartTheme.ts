import type { CbcRating } from "@uganda-cbc-sms/shared";

/** Chart fills — shared with PerformanceCharts (assessments_cbc / cbc_scores A–E displays). */
export const CBC_RATING_COLORS: Record<CbcRating, string> = {
  A: "#15803d",
  B: "#2563eb",
  C: "#d97706",
  D: "#ea580c",
  E: "#dc2626",
};

/** Badge pill classes aligned with CBC_RATING_COLORS (A darkest green → E red). */
export const CBC_RATING_BADGE: Record<CbcRating, string> = {
  A: "bg-green-700 text-green-50 dark:bg-green-800 dark:text-green-100",
  B: "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200",
  C: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  D: "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200",
  E: "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200",
};

export const CBC_RATING_SELECT: Record<CbcRating, string> = {
  A: "bg-green-50 dark:bg-green-950/30",
  B: "bg-blue-50 dark:bg-blue-950/30",
  C: "bg-amber-50 dark:bg-amber-950/30",
  D: "bg-orange-50 dark:bg-orange-950/30",
  E: "bg-red-50 dark:bg-red-950/30",
};

export const CHART_COLORS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777"];

export const PIPELINE_COLORS = {
  approved: "#16a34a",
  pendingApproval: "#d97706",
  notGenerated: "#94a3b8",
};

export const STATUS_COLORS = {
  Submitted: "#16a34a",
  Draft: "#94a3b8",
};
