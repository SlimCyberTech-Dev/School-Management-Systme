export type AcademicLevel = "O_LEVEL" | "A_LEVEL";

/** Normalize class/subject level from DB or API input. */
export function normalizeClassLevel(level: string | null | undefined): AcademicLevel {
  const normalized = (level ?? "").trim().toUpperCase().replace(/-/g, "_");
  if (normalized === "A_LEVEL" || normalized === "ALEVEL") return "A_LEVEL";
  return "O_LEVEL";
}

export function classTrackFromLevel(level: string | null | undefined): "cbc" | "alevel" {
  return normalizeClassLevel(level) === "A_LEVEL" ? "alevel" : "cbc";
}
