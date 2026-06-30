"use client";

import type { CbcRating } from "@uganda-cbc-sms/shared";
import { LetterGradeSelector } from "@/components/cbc/LetterGradeBadge";

/**
 * Five-option UNEB A–E selector (dropdown). Labels use tenant descriptors from grading scales.
 * Dropdown is used in dense grids (e.g. CbcActivityRatingsGrid) where a 5-segment toggle would not fit.
 */
export function CompetencyLevelSelector({
  value,
  onChange,
  disabled,
  className = "",
  compact = false,
}: {
  value: CbcRating | "";
  onChange: (grade: CbcRating | "") => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <LetterGradeSelector
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      compact={compact}
    />
  );
}
