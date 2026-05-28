import { z } from "zod";

const HEX_COLOR = /^#([0-9A-Fa-f]{6})$/;
const BARE_DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/:?#].*)?$/i;

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null));

function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("/uploads/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (BARE_DOMAIN.test(value)) return `https://${value}`;
  return value;
}

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((value) => (value == null ? null : normalizeUrl(value)))
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/uploads/")) return true;
    return /^https?:\/\/.+/i.test(value);
  }, "Enter a valid URL")
  .transform((value) => (value && value.length > 0 ? value : null));

const optionalEmail = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(160)
  .nullish()
  .transform((value) => (value && value.length > 0 ? value : null));

const optionalHexColor = z
  .string()
  .trim()
  .regex(HEX_COLOR, "Use a valid hex color like #1E40AF")
  .nullish()
  .transform((value) => (value && value.length > 0 ? value.toUpperCase() : null));

export const reportLayoutSchema = z.object({
  template: z.enum(["classic", "modern"]).default("modern"),
  density: z.enum(["compact", "comfortable"]).default("comfortable"),
  showStudentPhoto: z.boolean().default(true),
  showTableStripes: z.boolean().default(true),
  headerAlignment: z.enum(["left", "center"]).default("left"),
  cornerRadius: z.coerce.number().int().min(0).max(12).default(4),
  baseFontSize: z.coerce.number().int().min(8).max(12).default(9),
});

const optionalLayout = reportLayoutSchema.partial().nullish();

export const updateSchoolSettingsSchema = z
  .object({
    schoolName: z.string().trim().min(2).max(140).nullish(),
  motto: optionalTrimmed(180),
  vision: optionalTrimmed(600),
  mission: optionalTrimmed(1200),
  logoUrl: optionalUrl,
  contactEmail: optionalEmail,
  contactPhone: optionalTrimmed(40),
  websiteUrl: optionalUrl,
  postalAddress: optionalTrimmed(300),
  physicalAddress: optionalTrimmed(300),
  primaryColor: optionalHexColor,
  secondaryColor: optionalHexColor,
  reportFooterText: optionalTrimmed(280),
  reportLayout: optionalLayout,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type UpdateSchoolSettingsInput = z.infer<typeof updateSchoolSettingsSchema>;

export type SchoolSettings = UpdateSchoolSettingsInput & {
  updatedAt: string;
};
