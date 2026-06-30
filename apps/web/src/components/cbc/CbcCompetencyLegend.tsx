"use client";

import { CBC_RATINGS, type CbcRating } from "@uganda-cbc-sms/shared";
import { letterGradeSchema } from "@uganda-cbc-sms/shared/schemas/assessment.schema";
import { CompetencyLevelBadge } from "@/components/cbc/CompetencyLevelBadge";
import { useLetterGradeDescriptors } from "@/contexts/LetterGradeDescriptorContext";

export function CbcCompetencyLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {CBC_RATINGS.map((grade) => (
        <CompetencyLevelBadge key={grade} level={grade} size="sm" />
      ))}
    </div>
  );
}

export function CbcCompetencyLegendNote() {
  const { uiByGrade } = useLetterGradeDescriptors();
  return (
    <p className="text-xs text-muted-foreground">
      Achievement levels use your school&apos;s configured UNEB A–E descriptors.{" "}
      {CBC_RATINGS.map((g, i) => (
        <span key={g}>
          {i > 0 ? " · " : ""}
          <span className="font-medium text-foreground">{uiByGrade[g].label}</span>
        </span>
      ))}
    </p>
  );
}

export type { CbcRating as LetterGrade };
export { CBC_RATINGS, letterGradeSchema };

/** Pick UNEB letter from API row (letter_grade / legacy competency_level / rating). */
export function pickLetterGrade(row: Record<string, unknown>): CbcRating | null {
  const raw =
    row["letter_grade"] ??
    row["letterGrade"] ??
    row["aggregated_grade"] ??
    row["aggregatedGrade"] ??
    row["overridden_grade"] ??
    row["overriddenGrade"] ??
    row["effective_grade"] ??
    row["effectiveGrade"] ??
    row["achievement_grade"] ??
    row["achievementGrade"] ??
    row["rating"];
  if (typeof raw === "string") {
    const parsed = letterGradeSchema.safeParse(raw.trim().toUpperCase());
    if (parsed.success) return parsed.data;
  }
  return null;
}
