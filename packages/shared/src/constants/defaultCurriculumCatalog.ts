/** Default Uganda CBC / UNEB-oriented catalogue (tenant installs via curriculum setup). */

export type CatalogSubject = {
  code: string;
  name: string;
};

export type CatalogStrand = {
  code: string;
  name: string;
  subStrands: string[];
};

export const DEFAULT_O_LEVEL_SUBJECTS: CatalogSubject[] = [
  { code: "ENG", name: "English" },
  { code: "MATH", name: "Mathematics" },
  { code: "SCI", name: "Integrated Science" },
  { code: "SST", name: "Social Studies" },
  { code: "CRE", name: "Christian Religious Education" },
  { code: "ICT", name: "ICT" },
  { code: "LIT", name: "Literature in English" },
  { code: "ART", name: "Art and Design" },
  { code: "PE", name: "Physical Education" },
];

/** Compulsory O-Level subjects for UCE certification (school may override in assessment_config). */
export const DEFAULT_O_LEVEL_COMPULSORY_SUBJECT_CODES = ["ENG", "MATH", "SCI", "SST", "CRE"] as const;

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

export const DEFAULT_CBC_STRANDS_BY_SUBJECT_CODE: Record<string, CatalogStrand[]> = {
  ENG: [
    {
      code: "LISTEN",
      name: "Listening and Speaking",
      subStrands: ["Oral communication", "Pronunciation and fluency"],
    },
    {
      code: "READ",
      name: "Reading",
      subStrands: ["Comprehension", "Vocabulary development"],
    },
    {
      code: "WRITE",
      name: "Writing",
      subStrands: ["Composition", "Functional writing"],
    },
    {
      code: "GRAM",
      name: "Grammar and Language",
      subStrands: ["Sentence structure", "Language use"],
    },
  ],
  MATH: [
    {
      code: "NUM",
      name: "Numbers and Operations",
      subStrands: ["Whole numbers", "Fractions and decimals", "Ratio and proportion"],
    },
    {
      code: "ALG",
      name: "Algebra",
      subStrands: ["Expressions", "Equations and inequalities"],
    },
    {
      code: "GEO",
      name: "Geometry and Measurement",
      subStrands: ["Shapes and space", "Measurement"],
    },
    {
      code: "DATA",
      name: "Data Handling",
      subStrands: ["Statistics", "Probability"],
    },
  ],
  SCI: [
    {
      code: "BIO",
      name: "Biology Concepts",
      subStrands: ["Living things", "Human body systems"],
    },
    {
      code: "CHEM",
      name: "Chemistry Concepts",
      subStrands: ["Matter and materials", "Chemical reactions"],
    },
    {
      code: "PHY",
      name: "Physics Concepts",
      subStrands: ["Energy", "Forces and motion"],
    },
  ],
  SST: [
    {
      code: "HIST",
      name: "History and Citizenship",
      subStrands: ["Uganda history", "Citizenship"],
    },
    {
      code: "GEO",
      name: "Geography",
      subStrands: ["Physical geography", "Human geography"],
    },
  ],
  CRE: [
    {
      code: "BIB",
      name: "Biblical Studies",
      subStrands: ["Old Testament themes", "New Testament themes"],
    },
    {
      code: "MORAL",
      name: "Christian Living",
      subStrands: ["Values and ethics", "Service and leadership"],
    },
  ],
  ICT: [
    {
      code: "COMP",
      name: "Computer Skills",
      subStrands: ["Word processing", "Spreadsheets", "Presentation"],
    },
    {
      code: "NET",
      name: "Digital Literacy",
      subStrands: ["Internet safety", "Online research"],
    },
  ],
  LIT: [
    {
      code: "PROSE",
      name: "Prose and Drama",
      subStrands: ["Character and plot", "Themes"],
    },
    {
      code: "POETRY",
      name: "Poetry",
      subStrands: ["Imagery and tone", "Structure"],
    },
  ],
  ART: [
    {
      code: "CREATE",
      name: "Creative Production",
      subStrands: ["Drawing", "Design"],
    },
    {
      code: "APPREC",
      name: "Art Appreciation",
      subStrands: ["Elements of art", "Local art forms"],
    },
  ],
  PE: [
    {
      code: "FIT",
      name: "Physical Fitness",
      subStrands: ["Athletics", "Games and sports"],
    },
    {
      code: "HEALTH",
      name: "Health and Wellness",
      subStrands: ["Nutrition", "Personal safety"],
    },
  ],
};
