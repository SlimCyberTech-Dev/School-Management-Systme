"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const HERO_MESSAGES = [
  "Track attendance and learner progress in real time.",
  "Manage fees, classes, and reports in one place.",
  "Built for admins, teachers, and bursars.",
] as const;

export function HeroCopyCarousel() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_MESSAGES.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="max-w-sm">
      <p className="font-body mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100/70">
        Highlights
      </p>
      <div className="min-h-[4.5rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-body text-base font-medium leading-relaxed text-blue-100/95 xl:text-lg"
          >
            {HERO_MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

const BADGES = ["99.9% uptime", "Role-based access"] as const;

export function HeroTrustBadges() {
  return (
    <div className="flex flex-wrap gap-2">
      {BADGES.map((badge) => (
        <span
          key={badge}
          className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-blue-100/90 backdrop-blur-sm"
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
