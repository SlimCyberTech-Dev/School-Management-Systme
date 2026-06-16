"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Users,
} from "lucide-react";

const ORBIT_ICONS: LucideIcon[] = [BookOpen, Users, ClipboardCheck, CalendarDays, Building2];

const ORBIT_RADIUS = 118;
const ORBIT_DURATION = 36;

export function AuthOrbitIllustration() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="relative flex h-[min(52vh,420px)] w-full max-w-md items-center justify-center"
      aria-hidden
    >
      <div className="absolute h-44 w-44 rounded-full bg-white/10 blur-3xl" />

      <div
        className="pointer-events-none absolute rounded-full border border-dashed border-white/15"
        style={{ width: ORBIT_RADIUS * 2, height: ORBIT_RADIUS * 2 }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex h-28 w-28 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-lg shadow-blue-950/20 backdrop-blur-sm"
      >
        <motion.div
          animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <GraduationCap className="h-14 w-14 text-white" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ repeat: Infinity, duration: ORBIT_DURATION, ease: "linear" }}
      >
        {ORBIT_ICONS.map((Icon, index) => {
          const angle = (360 / ORBIT_ICONS.length) * index;
          return (
            <div
              key={index}
              className="absolute left-1/2 top-1/2"
              style={{
                width: 0,
                height: 0,
                transform: `rotate(${angle}deg) translateY(-${ORBIT_RADIUS}px)`,
              }}
            >
              <motion.div
                className="flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/90 shadow-md shadow-blue-950/15 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  reduceMotion
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 1, scale: 1, rotate: -360 }
                }
                transition={{
                  opacity: { delay: 0.15 + index * 0.08, duration: 0.4 },
                  scale: { delay: 0.15 + index * 0.08, duration: 0.4 },
                  rotate: reduceMotion
                    ? undefined
                    : { repeat: Infinity, duration: ORBIT_DURATION, ease: "linear" },
                }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
