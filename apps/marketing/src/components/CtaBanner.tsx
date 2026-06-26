import Link from "next/link";
import { Container } from "./Container";
import { CtaButton } from "./CtaButton";

type CtaBannerProps = {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function CtaBanner({
  title,
  description,
  primaryLabel = "Get started",
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaBannerProps) {
  return (
    <section className="relative overflow-hidden border-y border-brand/20 bg-brand-dark">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-subtle bg-grid opacity-30"
        aria-hidden
        style={{ "--grid-line": "rgba(255,255,255,0.06)" } as React.CSSProperties}
      />
      <Container className="relative py-section-sm text-center md:py-section">
        <h2 className="text-balance font-display text-heading-1 text-white">{title}</h2>
        <p className="mx-auto mt-3 max-w-prose text-body-lg text-white/80">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {primaryHref ? (
            <Link href={primaryHref} className="btn-primary bg-white text-brand-dark hover:bg-brand-light">
              {primaryLabel}
            </Link>
          ) : (
            <CtaButton className="bg-white text-brand-dark hover:bg-brand-light">{primaryLabel}</CtaButton>
          )}
          {secondaryLabel && secondaryHref ? (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-md border border-white/30 bg-transparent px-5 py-2.5 text-small font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
