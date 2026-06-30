import { z } from "zod";

export const curriculumTrackSchema = z.enum(["SCIENCES", "ARTS", "GENERAL"]);

export const curriculumSetupSchema = z.object({
  academicYearId: z.string().uuid(),
  level: z.enum(["O_LEVEL", "A_LEVEL"]),
  /** Seed default subject catalogue before provisioning class slots. Default true. */
  installCatalog: z.boolean().optional().default(true),
  termId: z.string().uuid().optional().nullable(),
});

export const curriculumCatalogSeedSchema = z.object({
  level: z.enum(["O_LEVEL", "A_LEVEL", "ALL"]).optional().default("ALL"),
});

export const curriculumClassTrackUpdateSchema = z.object({
  classId: z.string().uuid(),
  curriculumTrack: curriculumTrackSchema.nullable(),
});

export const curriculumClassTracksSchema = z.object({
  updates: z.array(curriculumClassTrackUpdateSchema).min(1).max(200),
});

export type CurriculumSetupInput = z.infer<typeof curriculumSetupSchema>;
export type CurriculumCatalogSeedInput = z.infer<typeof curriculumCatalogSeedSchema>;
export type CurriculumClassTracksInput = z.infer<typeof curriculumClassTracksSchema>;
export type CurriculumTrack = z.infer<typeof curriculumTrackSchema>;

export type CurriculumSetupResult = {
  installCatalog: boolean;
  subjectsCreated: number;
  classSubjectsCreated: number;
  classesProcessed: number;
  classesSkippedNoTrack: number;
};

export type CurriculumStatus = {
  academicYearId: string;
  catalog: {
    oLevelSubjects: number;
    aLevelSubjects: number;
    catalogAvailable: boolean;
  };
  oLevel: {
    classes: number;
    expectedSlotsPerClass: number;
    classesFullyProvisioned: number;
    totalClassSubjectRows: number;
  };
  aLevel: {
    classes: number;
    byTrack: Record<CurriculumTrack | "unset", number>;
    classesFullyProvisioned: number;
    classesMissingTrack: number;
    totalClassSubjectRows: number;
  };
};
