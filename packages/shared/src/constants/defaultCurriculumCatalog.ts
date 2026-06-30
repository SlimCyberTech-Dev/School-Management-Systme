/** Default Uganda CBC / NCDC Lower Secondary catalogue (tenant installs via curriculum setup). */

export type CatalogSubject = {
  code: string;
  name: string;
};

/**
 * NCDC Lower Secondary teaching subjects (21 national menu items).
 * Schools offer 12 at S1–S2: 11 compulsory + at least 1 elective.
 * CRE and IRE are separate catalog entries; learners take one RE offering (or both
 * where the school provides both — override compulsorySubjectCodes in assessment_config).
 */
export const DEFAULT_O_LEVEL_SUBJECTS: CatalogSubject[] = [
  // Compulsory at S1–S2 (11)
  { code: "ENG", name: "English" },
  { code: "MATH", name: "Mathematics" },
  { code: "PHY", name: "Physics" },
  { code: "CHEM", name: "Chemistry" },
  { code: "BIO", name: "Biology" },
  { code: "GEO", name: "Geography" },
  { code: "HPE", name: "History and Political Education" },
  { code: "CRE", name: "Christian Religious Education" },
  { code: "IRE", name: "Islamic Religious Education" },
  { code: "KISW", name: "Kiswahili" },
  { code: "ENT", name: "Entrepreneurship" },
  { code: "PE", name: "Physical Education" },
  // Electives (school picks at least 1 for S1–S2; more as the school scales)
  { code: "LIT", name: "Literature in English" },
  { code: "ART", name: "Art and Design" },
  { code: "PFA", name: "Performing Arts" },
  { code: "AGR", name: "Agriculture" },
  { code: "TAD", name: "Technology and Design" },
  { code: "ICT", name: "ICT" },
  { code: "NFT", name: "Nutrition and Food Technology" },
  { code: "FRE", name: "French" },
  { code: "GER", name: "German" },
  { code: "ARA", name: "Arabic" },
  { code: "CHI", name: "Chinese" },
  { code: "LOCL", name: "Local Language (school-specific)" },
];

/**
 * Default compulsory O-Level subjects for UCE certification (school may override in assessment_config).
 * Religious Education: CRE is the default compulsory code; schools offering IRE instead should
 * replace CRE with IRE (or configure both offerings) in assessment_config.compulsorySubjectCodes.
 */
export const DEFAULT_O_LEVEL_COMPULSORY_SUBJECT_CODES = [
  "ENG",
  "MATH",
  "PHY",
  "CHEM",
  "BIO",
  "GEO",
  "HPE",
  "CRE",
  "KISW",
  "ENT",
  "PE",
] as const;

export const DEFAULT_A_LEVEL_SUBJECTS: CatalogSubject[] = [
  { code: "GP", name: "General Paper" },
  { code: "MATH", name: "Mathematics" },
  { code: "PHY", name: "Physics" },
  { code: "CHEM", name: "Chemistry" },
  { code: "BIO", name: "Biology" },
  { code: "HIS", name: "History" },
  { code: "GEO", name: "Geography" },
  { code: "DIV", name: "Divinity" },
  { code: "ECON", name: "Economics" },
  { code: "LIT", name: "Literature" },
  { code: "ENT", name: "Entrepreneurship" },
  { code: "ICT", name: "ICT" },
];

export const A_LEVEL_TRACK_SUBJECT_CODES = {
  SCIENCES: ["GP", "MATH", "PHY", "CHEM", "BIO", "ICT"],
  ARTS: ["GP", "HIS", "GEO", "DIV", "ECON", "LIT", "ENT"],
  GENERAL: ["GP", "MATH", "ICT"],
} as const;

export type ALevelTrackKey = keyof typeof A_LEVEL_TRACK_SUBJECT_CODES;
