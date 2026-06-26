"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type ImageRevealVariant = "hero" | "from-left" | "from-right" | "rise";

type ImageRevealProps = {
  src: string;
  alt: string;
  variant?: ImageRevealVariant;
  priority?: boolean;
  delay?: number;
  className?: string;
  sizes?: string;
};

const frameAccent: Record<ImageRevealVariant, string> = {
  hero: "from-brand/20 via-transparent to-brand/10",
  "from-left": "from-brand/15 via-transparent to-transparent",
  "from-right": "from-transparent via-transparent to-brand/15",
  rise: "from-brand/10 via-transparent to-transparent",
};

export function ImageReveal({
  src,
  alt,
  variant = "rise",
  priority = false,
  delay = 0,
  className = "",
  sizes = "(max-width: 1024px) 100vw, 50vw",
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(priority);

  useEffect(() => {
    if (priority) return;

    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "120px 0px -5% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  const imageMotion = {
    hero: visible
      ? "scale-100 opacity-100 [clip-path:inset(0%_0%_0%_0%_round_1rem)]"
      : "scale-[1.04] opacity-0 [clip-path:inset(4%_6%_8%_6%_round_1.25rem)]",
    "from-left": visible
      ? "translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100"
      : "-translate-x-8 translate-y-3 -rotate-1 scale-[0.96] opacity-0",
    "from-right": visible
      ? "translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100"
      : "translate-x-8 translate-y-3 rotate-1 scale-[0.96] opacity-0",
    rise: visible
      ? "translate-y-0 scale-100 opacity-100"
      : "translate-y-6 scale-[0.97] opacity-0",
  }[variant];

  const frameMotion = visible ? "scale-100 opacity-100" : "scale-[0.98] opacity-0";

  return (
    <div ref={ref} className={`relative ${className}`} style={{ perspective: "1200px" }}>
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-2 rounded-[1.35rem] bg-gradient-to-br transition-all duration-700 ease-smooth sm:-inset-3 ${frameAccent[variant]} ${frameMotion}`}
        style={{ transitionDelay: `${delay}ms` }}
      />
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-muted shadow-elevated ring-1 ring-border">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          className={`object-cover object-center transition-all duration-700 ease-smooth ${imageMotion}`}
          style={{ transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}
