import type { FeeScheduleStatus } from "@uganda-cbc-sms/shared";

export function feeScheduleStatusLabel(status: FeeScheduleStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "published":
      return "Published";
    case "billed":
      return "Billed";
    default:
      return status;
  }
}

export function feeScheduleStatusTone(
  status: FeeScheduleStatus,
): "neutral" | "success" | "warning" {
  switch (status) {
    case "draft":
      return "neutral";
    case "published":
      return "warning";
    case "billed":
      return "success";
    default:
      return "neutral";
  }
}

export function isFeeStructureLocked(status: FeeScheduleStatus | undefined): boolean {
  return status === "published" || status === "billed";
}
