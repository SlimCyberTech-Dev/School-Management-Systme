"use client";

import type { CompetencyLevel } from "@/lib/cbcCompetency";
import { COMPETENCY_LEVEL_SELECT_OPTIONS, COMPETENCY_LEVEL_UI } from "@/lib/cbcCompetency";
import { Select } from "@/components/ui/Select";

export function CompetencyLevelSelector({
  value,
  onChange,
  disabled,
  className = "",
}: {
  value: CompetencyLevel | "";
  onChange: (level: CompetencyLevel | "") => void;
  disabled?: boolean;
  className?: string;
}) {
  const tint = value ? COMPETENCY_LEVEL_UI[value].select : "";

  return (
    <Select
      options={COMPETENCY_LEVEL_SELECT_OPTIONS}
      value={value}
      disabled={disabled}
      className={`min-w-[10.5rem] text-xs ${tint} ${className}`}
      onChange={(e) => onChange((e.target.value || "") as CompetencyLevel | "")}
    />
  );
}
