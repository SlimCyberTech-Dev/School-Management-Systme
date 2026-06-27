import type { CompetencyLevel } from "@/lib/cbcCompetency";
import { COMPETENCY_LEVEL_UI } from "@/lib/cbcCompetency";

export function CompetencyLevelBadge({
  level,
  size = "md",
  overridden,
}: {
  level: CompetencyLevel;
  size?: "sm" | "md";
  /** Headteacher override styling */
  overridden?: boolean;
}) {
  const ui = COMPETENCY_LEVEL_UI[level];
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full font-medium ${sizeClass} ${ui.badge} ${
        overridden ? "ring-2 ring-violet-400/60 ring-offset-1 ring-offset-background" : ""
      }`}
    >
      {overridden ? (
        <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300" title="Overridden by headteacher">
          ✦
        </span>
      ) : null}
      <span className="truncate">{ui.label}</span>
    </span>
  );
}
