"use client";

import { useState } from "react";

const tracks = [
  {
    id: "olevel",
    label: "O-Level",
    forms: "S1 – S4",
    accent: "brand" as const,
    items: [
      { label: "Grades", value: "A – E letter bands" },
      { label: "Assessment", value: "Exam marks + project work" },
      { label: "Composite", value: "Project + exam average (e.g. 20/80)" },
      { label: "Reports", value: "Term subject grid with C1…Cn exams" },
    ],
  },
  {
    id: "alevel",
    label: "A-Level (UNEB)",
    forms: "S5 – S6",
    accent: "accent" as const,
    items: [
      { label: "Input", value: "Numerical exam scores" },
      { label: "Grades", value: "A – F with points 1 – 9" },
      { label: "Aggregate", value: "Combination subject totals" },
      { label: "Outcome", value: "Division I – IV" },
    ],
  },
] as const;

const accentStyles = {
  brand: {
    tab: "border-brand bg-brand text-white",
    tabIdle: "border-transparent text-muted-foreground hover:text-foreground",
    badge: "bg-brand-light text-brand-dark dark:bg-brand-dark/50 dark:text-green-200",
    dot: "bg-brand",
    row: "border-brand/15 bg-brand-light/40 dark:border-brand/25 dark:bg-brand-dark/20",
  },
  accent: {
    tab: "border-accent bg-accent text-white",
    tabIdle: "border-transparent text-muted-foreground hover:text-foreground",
    badge: "bg-accent-light text-accent-deep dark:bg-accent-deep/40 dark:text-blue-200",
    dot: "bg-accent",
    row: "border-accent/15 bg-accent-light/50 dark:border-accent/25 dark:bg-accent-deep/20",
  },
};

export function CurriculumComparison() {
  const [active, setActive] = useState<(typeof tracks)[number]["id"]>("olevel");
  const track = tracks.find((t) => t.id === active) ?? tracks[0];
  const styles = accentStyles[track.accent];

  return (
    <div className="surface-card overflow-hidden">
      <div
        role="tablist"
        aria-label="Curriculum comparison"
        className="grid grid-cols-2 border-b border-border"
      >
        {tracks.map((t) => {
          const isActive = t.id === active;
          const tStyles = accentStyles[t.accent];
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${t.id}`}
              className={`border-b-2 px-4 py-4 text-left transition-colors focus-visible:z-10 sm:px-6 ${
                isActive ? tStyles.tab : tStyles.tabIdle
              }`}
              onClick={() => setActive(t.id)}
            >
              <span className="block font-display text-heading-3">{t.label}</span>
              <span className={`mt-0.5 block text-small ${isActive ? "text-white/85" : ""}`}>{t.forms}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${track.id}`}
        aria-labelledby={`tab-${track.id}`}
        className="p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-caption ${styles.badge}`}>
            {track.forms}
          </span>
          <span className="text-small text-muted-foreground">Separate flows, shared student records</span>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {track.items.map((item) => (
            <div key={item.label} className={`rounded-lg border px-4 py-3 ${styles.row}`}>
              <dt className="flex items-center gap-2 text-caption uppercase text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden />
                {item.label}
              </dt>
              <dd className="mt-1 font-display text-heading-3 text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
