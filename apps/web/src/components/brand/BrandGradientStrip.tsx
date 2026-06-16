import type { ReactNode } from "react";
import { BRAND_GRADIENT_CLASS, BRAND_GRADIENT_GLOW_CLASS } from "@/lib/brand";

type BrandGradientStripProps = {
  children: ReactNode;
  className?: string;
};

/** Blue brand band used on auth panels and dashboard sidebar header */
export function BrandGradientStrip({ children, className = "" }: BrandGradientStripProps) {
  return (
    <div className={`relative overflow-hidden ${BRAND_GRADIENT_CLASS} ${className}`}>
      <div className={`pointer-events-none absolute inset-0 ${BRAND_GRADIENT_GLOW_CLASS}`} aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}
