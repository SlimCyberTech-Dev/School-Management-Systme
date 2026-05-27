"use client";

import Link from "next/link";
import { ClipboardCheck, FileText, GraduationCap } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

const ENTRY_LINKS = [
  {
    href: "/admin/assessment/cbc",
    title: "CBC assessment (O-Level)",
    description:
      "Term competency ratings (A–D) per strand for O-Level classes. Use this for continuous CBC assessment, not formal exams.",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/assessment/alevel",
    title: "A-Level assessment",
    description:
      "Term subject scores (0–100) with grades from the A-Level grading scale. Division summaries are computed from these scores.",
    icon: GraduationCap,
  },
  {
    href: "/admin/exams",
    title: "Formal exams",
    description:
      "Create and manage exam events (draft → open → closed). Teachers enter marks per exam paper; O-Level and A-Level each use their own grading scale.",
    icon: FileText,
  },
];

export default function AdminAssessmentHubPage() {
  return (
    <PageWrapper
      title="Assessment"
      description="Term assessment and formal exams are separate workflows. Choose the right tool for the job."
    >
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        <strong className="font-medium text-foreground">Term assessment</strong> (CBC competencies or A-Level
        scores) feeds report cards across the term. <strong className="font-medium text-foreground">Formal exams</strong>{" "}
        are one-off papers with their own lifecycle and teacher marking queue.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ENTRY_LINKS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group block h-full">
            <div className="h-full rounded-lg border border-border bg-card p-4 shadow-sm transition-ui group-hover:border-brand/40 group-hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-foreground group-hover:text-brand">{title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-brand">Open →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6">
      <Card title="Grading scales">
        <p className="text-sm text-muted-foreground">
          O-Level and A-Level numeric grade bands (A–F, points, descriptors) are configured under{" "}
          <Link href="/admin/academic/grading-scales" className="font-medium text-brand hover:underline">
            Academic → Grading scales
          </Link>
          . Exam marking and A-Level assessment both read from the scale that matches the class level.
        </p>
      </Card>
      </div>
    </PageWrapper>
  );
}
