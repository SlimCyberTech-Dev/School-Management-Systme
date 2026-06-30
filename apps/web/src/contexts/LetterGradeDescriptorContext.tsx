"use client";

import {
  buildLetterGradeDescriptorMap,
  CBC_RATINGS,
  formatLetterGradeLabel,
  type CbcRating,
} from "@uganda-cbc-sms/shared";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { CBC_RATING_BADGE, CBC_RATING_SELECT } from "@/components/reports/chartTheme";
import { useGradingScales, type GradingScaleRow } from "@/hooks/useGradingScales";

export type LetterGradeUi = {
  letter: CbcRating;
  descriptor: string;
  label: string;
  badge: string;
  select: string;
};

type LetterGradeDescriptorContextValue = {
  descriptorMap: Record<CbcRating, string>;
  grades: CbcRating[];
  uiByGrade: Record<CbcRating, LetterGradeUi>;
  selectOptions: Array<{ value: string; label: string }>;
  isLoading: boolean;
};

const LetterGradeDescriptorContext = createContext<LetterGradeDescriptorContextValue | null>(null);

function buildUi(descriptorMap: Record<CbcRating, string>): LetterGradeDescriptorContextValue {
  const uiByGrade = Object.fromEntries(
    CBC_RATINGS.map((letter) => [
      letter,
      {
        letter,
        descriptor: descriptorMap[letter],
        label: formatLetterGradeLabel(letter, descriptorMap),
        badge: CBC_RATING_BADGE[letter],
        select: CBC_RATING_SELECT[letter],
      },
    ]),
  ) as Record<CbcRating, LetterGradeUi>;

  return {
    descriptorMap,
    grades: [...CBC_RATINGS],
    uiByGrade,
    selectOptions: [
      { value: "", label: "—" },
      ...CBC_RATINGS.map((letter) => ({
        value: letter,
        label: uiByGrade[letter].label,
      })),
    ],
    isLoading: false,
  };
}

export function LetterGradeDescriptorProvider({ children }: { children: ReactNode }) {
  const scalesQ = useGradingScales("O_LEVEL");
  const value = useMemo(() => {
    const bands: LetterGradeDescriptorBand[] = (scalesQ.data ?? []).map((r: GradingScaleRow) => ({
      grade: r.grade,
      descriptor: r.descriptor,
      isActive: r.isActive,
    }));
    const descriptorMap = buildLetterGradeDescriptorMap(bands);
    return { ...buildUi(descriptorMap), isLoading: scalesQ.isLoading };
  }, [scalesQ.data, scalesQ.isLoading]);

  return (
    <LetterGradeDescriptorContext.Provider value={value}>{children}</LetterGradeDescriptorContext.Provider>
  );
}

type LetterGradeDescriptorBand = {
  grade: string;
  descriptor?: string | null;
  isActive?: boolean;
};

export function useLetterGradeDescriptors(): LetterGradeDescriptorContextValue {
  const ctx = useContext(LetterGradeDescriptorContext);
  if (ctx) return ctx;
  return buildUi(buildLetterGradeDescriptorMap([]));
}
