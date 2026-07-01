import { getResolvedFromOverride } from "./verifyMailConfig.js";

/** Lightweight mail readiness for /api/health (no external API calls). */
export function getMailHealthStatus(): {
  configured: boolean;
  hasApiKey: boolean;
  hasFrom: boolean;
  fromDomain: string | null;
  resolvedFromOverride: boolean;
} {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const hasFrom = Boolean(from);
  const fromDomain = from.match(/@([^\s>]+)/)?.[1] ?? null;
  const resolvedFromOverride = Boolean(getResolvedFromOverride());
  return {
    configured: hasApiKey && (hasFrom || resolvedFromOverride),
    hasApiKey,
    hasFrom,
    fromDomain,
    resolvedFromOverride,
  };
}
