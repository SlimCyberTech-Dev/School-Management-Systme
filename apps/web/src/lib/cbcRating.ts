import { CBC_RATING_BANDS, CBC_RATINGS, type CbcRating } from "@uganda-cbc-sms/shared";

export type { CbcRating };

export const CBC_RATING_OPTIONS = [
  { value: "", label: "—" },
  ...CBC_RATINGS.map((r) => ({
    value: r,
    label: `${r} — ${CBC_RATING_BANDS[r].descriptor}`,
  })),
];

export const CBC_RATING_CELL_COLORS: Record<string, string> = {
  A: "bg-green-100 dark:bg-green-950/40",
  B: "bg-blue-100 dark:bg-blue-950/40",
  C: "bg-amber-100 dark:bg-amber-950/40",
  D: "bg-orange-100 dark:bg-orange-950/40",
  E: "bg-slate-100 dark:bg-slate-800/40",
};
