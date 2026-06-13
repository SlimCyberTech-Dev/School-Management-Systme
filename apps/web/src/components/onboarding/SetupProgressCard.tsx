"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { OnboardingStatus } from "@uganda-cbc-sms/shared";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { apiGet } from "@/lib/api";

export function SetupProgressCard() {
  const statusQ = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => apiGet<OnboardingStatus>("/onboarding/status"),
    staleTime: 60_000,
  });

  const status = statusQ.data;
  if (!status || status.completedAt || !status.required) return null;
  if (status.progressPercent >= 100) return null;

  const items = [
    { label: "Password updated", done: status.checklist.passwordChanged },
    { label: "School profile", done: status.checklist.settingsConfigured },
    { label: "Academic calendar", done: status.checklist.academicYearCreated && status.checklist.termCreated },
    { label: "Classes", done: status.checklist.classesCreated },
    { label: "Grading scales", done: status.checklist.gradingScalesSeeded },
  ];

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
      <Card title="Finish school setup">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-indigo-900 dark:text-indigo-100">
            <Sparkles className="h-4 w-4" />
            {status.progressPercent}% complete
          </p>
          <ul className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.label} className={item.done ? "text-emerald-700 dark:text-emerald-400" : undefined}>
                {item.done ? "✓" : "○"} {item.label}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/admin/onboarding"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Continue setup
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      </Card>
    </div>
  );
}
