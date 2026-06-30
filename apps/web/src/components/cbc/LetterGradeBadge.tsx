"use client";

import { CBC_RATINGS, type CbcRating } from "@uganda-cbc-sms/shared";
import { useLetterGradeDescriptors } from "@/contexts/LetterGradeDescriptorContext";
import { Select } from "@/components/ui/Select";

export function LetterGradeBadge({
  grade,
  size = "md",
  overridden,
}: {
  grade: CbcRating;
  size?: "sm" | "md";
  overridden?: boolean;
}) {
  const { uiByGrade } = useLetterGradeDescriptors();
  const ui = uiByGrade[grade];
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full font-medium ${sizeClass} ${ui.badge} ${
        overridden ? "ring-2 ring-violet-400/60 ring-offset-1 ring-offset-background" : ""
      }`}
      title={ui.label}
    >
      {overridden ? (
        <span
          className="text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300"
          title="Overridden by headteacher"
        >
          ✦
        </span>
      ) : null}
      <span className="font-semibold">{grade}</span>
      <span className="truncate font-normal opacity-90">{ui.descriptor}</span>
    </span>
  );
}

export function LetterGradeSelector({
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
  /** Narrow width for dense rating grids (one selector per table cell). */
  compact?: boolean;
}) {
  const { selectOptions, uiByGrade } = useLetterGradeDescriptors();
  const tint = value ? uiByGrade[value].select : "";

  return (
    <Select
      options={selectOptions}
      value={value}
      disabled={disabled}
      className={`${compact ? "min-w-[8.5rem] max-w-[9rem]" : "min-w-[11rem]"} text-xs ${tint} ${className}`}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) onChange("");
        else if (CBC_RATINGS.includes(v as CbcRating)) onChange(v as CbcRating);
      }}
    />
  );
}
