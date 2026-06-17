import {
  CBC_RATINGS,
  getCbcRatingScore,
  type CbcRating,
} from "../constants/cbcRatingBands";
import { DEFAULT_O_LEVEL_COMPULSORY_SUBJECT_CODES } from "../constants/defaultCurriculumCatalog";
import { resolveGradeFromScaleRows, type DefaultGradingScaleRow } from "../constants/assessmentGradingScales";

export type CaRulesMethod = "school_defined" | "rating_score_map" | "weighted_strand_average";

export type AssessmentConfig = {
  caWeight: number;
  eocWeight: number;
  caRules: {
    method: CaRulesMethod;
    ratingScoreMap: Record<CbcRating, number>;
    strandWeights?: Record<string, Record<string, number>>;
  };
  minimumSubjects: number;
  qualifyingGradeMin: CbcRating;
  compulsorySubjectCodes: string[] | null;
};

export const DEFAULT_CA_RATING_SCORE_MAP: Record<CbcRating, number> = {
  A: 100,
  B: 80,
  C: 60,
  D: 40,
  E: 20,
};

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
  caWeight: 0.2,
  eocWeight: 0.8,
  caRules: {
    method: "rating_score_map",
    ratingScoreMap: { ...DEFAULT_CA_RATING_SCORE_MAP },
  },
  minimumSubjects: 8,
  qualifyingGradeMin: "D",
  compulsorySubjectCodes: null,
};

export type StrandRating = {
  strand: string;
  rating: string;
};

export type OlevelSubjectResultInput = {
  subjectCode: string;
  caScore: number | null;
  eocScore: number | null;
  caComplete: boolean;
  projectComplete: boolean;
  finalGrade: CbcRating | null;
  compositeScore: number | null;
};

export type OlevelCertificationReason =
  | "missing_compulsory"
  | "subjects_lt_8"
  | "missing_ca"
  | "missing_project"
  | "all_grade_e"
  | "no_qualifying_grade";

export type OlevelCertificationResult = {
  resultCode: "RESULT_1" | "RESULT_2" | "RESULT_3";
  reasonCodes: OlevelCertificationReason[];
};

const QUALIFYING_GRADES: Record<CbcRating, CbcRating[]> = {
  A: ["A"],
  B: ["A", "B"],
  C: ["A", "B", "C"],
  D: ["A", "B", "C", "D"],
  E: ["A", "B", "C", "D", "E"],
};

export function mergeAssessmentConfig(
  partial: Partial<AssessmentConfig> | null | undefined,
): AssessmentConfig {
  if (!partial || typeof partial !== "object") return { ...DEFAULT_ASSESSMENT_CONFIG };
  return {
    caWeight: partial.caWeight ?? DEFAULT_ASSESSMENT_CONFIG.caWeight,
    eocWeight: partial.eocWeight ?? DEFAULT_ASSESSMENT_CONFIG.eocWeight,
    caRules: {
      method: partial.caRules?.method ?? DEFAULT_ASSESSMENT_CONFIG.caRules.method,
      ratingScoreMap: {
        ...DEFAULT_CA_RATING_SCORE_MAP,
        ...(partial.caRules?.ratingScoreMap ?? {}),
      },
      strandWeights: partial.caRules?.strandWeights,
    },
    minimumSubjects: partial.minimumSubjects ?? DEFAULT_ASSESSMENT_CONFIG.minimumSubjects,
    qualifyingGradeMin: partial.qualifyingGradeMin ?? DEFAULT_ASSESSMENT_CONFIG.qualifyingGradeMin,
    compulsorySubjectCodes:
      partial.compulsorySubjectCodes === undefined
        ? DEFAULT_ASSESSMENT_CONFIG.compulsorySubjectCodes
        : partial.compulsorySubjectCodes,
  };
}

export function resolveCompulsorySubjectCodes(config: AssessmentConfig): string[] {
  return config.compulsorySubjectCodes ?? [...DEFAULT_O_LEVEL_COMPULSORY_SUBJECT_CODES];
}

/** Convert strand competency ratings to a 0–100 CA percentage using school rules. */
export function resolveCaScore(
  strandRatings: StrandRating[],
  config: AssessmentConfig,
  subjectCode?: string,
): { score: number | null; complete: boolean } {
  if (strandRatings.length === 0) return { score: null, complete: false };

  const method = config.caRules.method === "school_defined"
    ? "rating_score_map"
    : config.caRules.method;

  if (method === "weighted_strand_average" && subjectCode && config.caRules.strandWeights?.[subjectCode]) {
    const weights = config.caRules.strandWeights[subjectCode]!;
    let weightedSum = 0;
    let weightTotal = 0;
    for (const row of strandRatings) {
      const w = weights[row.strand] ?? 1;
      const rating = row.rating.trim().toUpperCase() as CbcRating;
      const pct = config.caRules.ratingScoreMap[rating];
      if (pct == null) continue;
      weightedSum += pct * w;
      weightTotal += w;
    }
    if (weightTotal === 0) return { score: null, complete: false };
    return { score: Math.round((weightedSum / weightTotal) * 100) / 100, complete: true };
  }

  const map = config.caRules.ratingScoreMap;
  const values: number[] = [];
  for (const row of strandRatings) {
    const rating = row.rating.trim().toUpperCase() as CbcRating;
    const pct = map[rating];
    if (pct != null) values.push(pct);
  }
  if (values.length === 0) return { score: null, complete: false };
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return {
    score: Math.round(avg * 100) / 100,
    complete: values.length === strandRatings.length,
  };
}

export function computeCompositeScore(
  caScore: number | null,
  eocScore: number | null,
  config: AssessmentConfig,
): number | null {
  if (caScore == null || eocScore == null) return null;
  const composite = config.caWeight * caScore + config.eocWeight * eocScore;
  return Math.round(composite * 100) / 100;
}

export function finalOLevelSubjectGrade(
  caScore: number | null,
  eocScore: number | null,
  bands: Array<Pick<DefaultGradingScaleRow, "grade" | "minScore" | "maxScore" | "sortOrder"> & { isActive?: boolean }>,
  config: AssessmentConfig = DEFAULT_ASSESSMENT_CONFIG,
): { finalGrade: CbcRating | null; compositeScore: number | null } {
  const compositeScore = computeCompositeScore(caScore, eocScore, config);
  if (compositeScore == null) return { finalGrade: null, compositeScore: null };
  const resolved = resolveGradeFromScaleRows(compositeScore, bands);
  const grade = resolved?.grade?.toUpperCase() as CbcRating | undefined;
  if (!grade || !CBC_RATINGS.includes(grade)) return { finalGrade: null, compositeScore };
  return { finalGrade: grade, compositeScore };
}

function isQualifyingGrade(grade: CbcRating, minGrade: CbcRating): boolean {
  return (QUALIFYING_GRADES[minGrade] ?? QUALIFYING_GRADES.D).includes(grade);
}

/** Compute UCE Result 1 / 2 / 3 from per-subject summaries. */
export function computeOlevelCertification(
  subjects: OlevelSubjectResultInput[],
  config: AssessmentConfig = DEFAULT_ASSESSMENT_CONFIG,
): OlevelCertificationResult {
  const compulsory = resolveCompulsorySubjectCodes(config);
  const sat = subjects.filter((s) => s.finalGrade != null);
  const reasons: OlevelCertificationReason[] = [];

  if (sat.length > 0 && sat.every((s) => s.finalGrade === "E")) {
    return { resultCode: "RESULT_3", reasonCodes: ["all_grade_e"] };
  }

  const compulsorySat = compulsory.filter((code) =>
    sat.some((s) => s.subjectCode.toUpperCase() === code.toUpperCase()),
  );
  if (compulsorySat.length < compulsory.length) {
    reasons.push("missing_compulsory");
  }

  if (sat.length < config.minimumSubjects) {
    reasons.push("subjects_lt_8");
  }

  const incompleteCa = sat.some((s) => !s.caComplete);
  if (incompleteCa) reasons.push("missing_ca");

  const incompleteProject = sat.some((s) => !s.projectComplete);
  if (incompleteProject) reasons.push("missing_project");

  const hasQualifying = sat.some(
    (s) => s.finalGrade != null && isQualifyingGrade(s.finalGrade, config.qualifyingGradeMin),
  );
  if (!hasQualifying && sat.length > 0) {
    reasons.push("no_qualifying_grade");
  }

  if (reasons.length > 0) {
    return { resultCode: "RESULT_2", reasonCodes: reasons };
  }

  return { resultCode: "RESULT_1", reasonCodes: [] };
}

export const OLEVEL_CERTIFICATION_LABELS: Record<string, string> = {
  RESULT_1: "Result 1 — Certificate awarded",
  RESULT_2: "Result 2 — Does not qualify",
  RESULT_3: "Result 3 — All subjects at E",
};

export const OLEVEL_CERTIFICATION_REASON_LABELS: Record<OlevelCertificationReason, string> = {
  missing_compulsory: "One or more compulsory subjects not sat",
  subjects_lt_8: "Fewer than 8 subjects with final grades",
  missing_ca: "Continuous assessment incomplete for one or more subjects",
  missing_project: "Project work incomplete for one or more subjects",
  all_grade_e: "Every sat subject at grade E",
  no_qualifying_grade: "No subject at D or better (D+)",
};
