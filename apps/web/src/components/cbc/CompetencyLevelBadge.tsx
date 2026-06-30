import type { CbcRating } from "@uganda-cbc-sms/shared";
import { LetterGradeBadge } from "@/components/cbc/LetterGradeBadge";

/** UNEB A–E achievement badge with tenant-configured descriptor text. */
export function CompetencyLevelBadge({
  grade,
  level,
  ...props
}: {
  /** Preferred — UNEB letter A–E */
  grade?: CbcRating;
  /** @deprecated Use `grade` */
  level?: CbcRating;
  size?: "sm" | "md";
  overridden?: boolean;
}) {
  const letter = grade ?? level;
  if (!letter) return null;
  return <LetterGradeBadge grade={letter} {...props} />;
}
