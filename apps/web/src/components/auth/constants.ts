import { BRAND } from "@/lib/brand";

export const AUTH_BRAND = {
  productName: BRAND.productName,
  companyName: BRAND.companyName,
  slogan: BRAND.companyTagline,
  logoIcon: BRAND.logoIcon,
  logoFull: BRAND.logoFull,
};

export const AUTH_COLORS = {
  primaryBlue: "#2563EB",
  darkBlue: "#1E3A8A",
  lightBlueTint: "#EFF6FF",
  textPrimary: "#111827",
  textMuted: "#6B7280",
  errorRed: "#EF4444",
  successGreen: "#10B981",
  warningAmber: "#F59E0B",
};

export const AUTH_COPY = {
  forgotSubtitle:
    "Enter the email address linked to your account and we'll send you a reset link.",
  resetSubtitle:
    "Your new password must be at least 8 characters and include a mix of letters and numbers.",
  verifyLoadingSubtext: "This will only take a moment.",
  verifyErrorHelp: "This link may have expired or already been used.",
  checkEmailBody:
    "Click the link in the email to activate your account. The link expires in 24 hours.",
};
