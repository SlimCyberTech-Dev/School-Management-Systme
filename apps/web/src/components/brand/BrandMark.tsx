import { BRAND } from "@/lib/brand";

type BrandMarkProps = {
  /** Context line above company name, e.g. Sign in */
  eyebrow?: string;
  subtitle?: string;
  tone?: "gradient" | "surface" | "platform";
  size?: "hero" | "header" | "compact";
  className?: string;
};

export function BrandMark({
  eyebrow,
  subtitle,
  tone = "surface",
  size = "header",
  className = "",
}: BrandMarkProps) {
  const onGradient = tone === "gradient";
  const onPlatform = tone === "platform";

  const eyebrowClass = onGradient
    ? "text-blue-100/80"
    : onPlatform
      ? "text-violet-300/80"
      : "text-muted-foreground";

  const companyClass = onGradient
    ? "text-blue-100/70"
    : onPlatform
      ? "text-violet-300/90"
      : "text-muted-foreground";

  const productClass = onGradient || onPlatform ? "text-white" : "text-foreground";

  const subtitleClass = onGradient
    ? "text-blue-100/90"
    : onPlatform
      ? "text-slate-400"
      : "text-muted-foreground";

  const productSizeClass =
    size === "hero"
      ? "text-4xl leading-tight xl:text-5xl"
      : size === "header"
        ? "text-lg leading-tight"
        : "text-sm leading-tight";

  const subtitleSizeClass = size === "hero" ? "mt-4 text-sm leading-relaxed" : "mt-0.5 text-xs";

  return (
    <div className={className}>
      {eyebrow ? (
        <p className={`font-body text-xs font-medium uppercase tracking-[0.2em] ${eyebrowClass}`}>
          {eyebrow}
        </p>
      ) : null}
      <p
        className={`font-body text-[10px] font-semibold uppercase tracking-[0.16em] ${companyClass} ${
          eyebrow ? "mt-2" : ""
        }`}
      >
        {BRAND.companyName}
      </p>
      <p className={`font-heading font-semibold ${productSizeClass} ${productClass} mt-0.5`}>
        {BRAND.productName}
      </p>
      {subtitle ? (
        <p className={`font-body ${subtitleSizeClass} ${subtitleClass}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}
