import { resolveApiOrigin } from "@/lib/apiBaseUrl";

/** Resolve API-relative upload paths to a browser-loadable URL. */
export function resolveUploadUrl(relativeUrl: string | null | undefined): string | null {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith("http")) return relativeUrl;
  const origin = resolveApiOrigin();
  return `${origin}${relativeUrl.startsWith("/") ? "" : "/"}${relativeUrl}`;
}
