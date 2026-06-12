import { Badge } from "@/components/ui/Badge";
import type { ExamStatus } from "@uganda-cbc-sms/shared";

const LABELS: Record<ExamStatus, string> = {
  draft: "Draft",
  open: "Open for marking",
  closed: "Closed",
};

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  const tone =
    status === "open" ? "success" : status === "draft" ? "warning" : ("neutral" as const);
  return <Badge tone={tone}>{LABELS[status]}</Badge>;
}
