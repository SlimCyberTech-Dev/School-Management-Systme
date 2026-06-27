import type { AssessmentActivityType } from "@/lib/cbcCompetency";
import { ACTIVITY_TYPE_LABELS } from "@/lib/cbcCompetency";

const ICON: Record<AssessmentActivityType, string> = {
  assignment: "📝",
  project: "📁",
  group_work: "👥",
  practical: "🔬",
  participation: "💬",
  presentation: "📊",
  test: "📋",
};

export function ActivityTypeBadge({ type }: { type: AssessmentActivityType }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <span aria-hidden>{ICON[type]}</span>
      {ACTIVITY_TYPE_LABELS[type]}
    </span>
  );
}
