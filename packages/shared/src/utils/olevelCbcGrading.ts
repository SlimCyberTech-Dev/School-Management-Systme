import type { CbcRating } from "../constants/cbcRatingBands";

export type ProjectWorkAggregation = "mean_of_projects" | "mean_of_term_means";

export type ExamsIncludedPolicy = "compulsory_only" | "all_with_marks";

export type AssessmentConfig = {
  /** Project work weight in term final grade (when includeProjectWorkInTermGrade). */
  caWeight: number;
  /** Exam-average weight in term final grade (when includeProjectWorkInTermGrade). */
  eocWeight: number;
  /** When true, blend project average with exam average using caWeight/eocWeight. */
  includeProjectWorkInTermGrade: boolean;
  /** Which exam papers feed the term exam average. */
  examsIncluded: ExamsIncludedPolicy;
  allowIncompleteCaOverride: boolean;
  policyVerifiedAt: string | null;
  projectWork: {
    expectedPerTerm: number;
    policyVerifiedAt: string | null;
  };
  caRules: {
    aggregation: ProjectWorkAggregation;
  };
};

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
  caWeight: 0.2,
  eocWeight: 0.8,
  includeProjectWorkInTermGrade: true,
  examsIncluded: "compulsory_only",
  allowIncompleteCaOverride: false,
  policyVerifiedAt: null,
  projectWork: {
    expectedPerTerm: 4,
    policyVerifiedAt: null,
  },
  caRules: {
    aggregation: "mean_of_projects",
  },
};

/** @deprecated Year-level engine version tag — term grades use TERM_FORMULA_VERSION. */
export const OLEVEL_FORMULA_VERSION = "term_exam_avg_v1";

export function mergeAssessmentConfig(
  partial: Partial<AssessmentConfig> | null | undefined,
): AssessmentConfig {
  if (!partial) return { ...DEFAULT_ASSESSMENT_CONFIG };

  return {
    caWeight: partial.caWeight ?? DEFAULT_ASSESSMENT_CONFIG.caWeight,
    eocWeight: partial.eocWeight ?? DEFAULT_ASSESSMENT_CONFIG.eocWeight,
    includeProjectWorkInTermGrade:
      partial.includeProjectWorkInTermGrade ?? DEFAULT_ASSESSMENT_CONFIG.includeProjectWorkInTermGrade,
    examsIncluded: partial.examsIncluded ?? DEFAULT_ASSESSMENT_CONFIG.examsIncluded,
    allowIncompleteCaOverride:
      partial.allowIncompleteCaOverride ?? DEFAULT_ASSESSMENT_CONFIG.allowIncompleteCaOverride,
    policyVerifiedAt: partial.policyVerifiedAt ?? DEFAULT_ASSESSMENT_CONFIG.policyVerifiedAt,
    projectWork: {
      expectedPerTerm:
        partial.projectWork?.expectedPerTerm ?? DEFAULT_ASSESSMENT_CONFIG.projectWork.expectedPerTerm,
      policyVerifiedAt:
        partial.projectWork?.policyVerifiedAt ?? DEFAULT_ASSESSMENT_CONFIG.projectWork.policyVerifiedAt,
    },
    caRules: {
      aggregation: partial.caRules?.aggregation ?? DEFAULT_ASSESSMENT_CONFIG.caRules.aggregation,
    },
  };
}

export function computeCompositeScore(
  projectAverage: number | null,
  examAverage: number | null,
  config: Pick<AssessmentConfig, "caWeight" | "eocWeight" | "includeProjectWorkInTermGrade">,
): number | null {
  if (examAverage == null && projectAverage == null) return null;
  if (!config.includeProjectWorkInTermGrade) return examAverage;
  if (examAverage != null && projectAverage != null) {
    return Math.round((config.caWeight * projectAverage + config.eocWeight * examAverage) * 100) / 100;
  }
  return examAverage ?? projectAverage;
}

export type { CbcRating };
