"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { AcademicLevel } from "@/lib/academicLevel";
import { parseAcademicLevel } from "@/lib/academicLevel";
import { academicSegment, getAcademicBasePath } from "@/lib/academicModulePaths";

export function useAcademicLevelScope(defaultLevel: AcademicLevel = "O_LEVEL") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const academicBasePath = useMemo(() => getAcademicBasePath(pathname), [pathname]);

  const level = useMemo(
    () => parseAcademicLevel(searchParams.get("level") ?? defaultLevel),
    [searchParams, defaultLevel],
  );

  const setLevel = useCallback(
    (next: AcademicLevel) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("level", next);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const hrefWithLevel = useCallback(
    (basePath: string, extra?: Record<string, string>) => {
      const p = new URLSearchParams();
      p.set("level", level);
      if (extra) {
        for (const [k, v] of Object.entries(extra)) {
          if (v) p.set(k, v);
        }
      }
      const q = p.toString();
      return `${basePath}${q ? `?${q}` : ""}`;
    },
    [level],
  );

  const academicHref = useCallback(
    (segment: string, extra?: Record<string, string>) =>
      hrefWithLevel(academicSegment(academicBasePath, segment), extra),
    [academicBasePath, hrefWithLevel],
  );

  return { level, setLevel, hrefWithLevel, academicBasePath, academicHref };
}
