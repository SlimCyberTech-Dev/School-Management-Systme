"use client";

import Link from "next/link";
import { ClipboardCheck, FileText, GraduationCap, Unlock } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

const LINKS = [
  {
    href: "/headteacher/assessment/cbc",
    title: "CBC (O-Level)",
    description: "Monitor competency ratings per subject. Unlock submitted sheets when corrections are approved.",
    icon: ClipboardCheck,
  },
  {
    href: "/headteacher/assessment/alevel",
    title: "A-Level",
    description: "Track term score entry and submission status across subjects in A-Level classes.",
    icon: GraduationCap,
  },
  {
    href: "/headteacher/exams",
    title: "Formal exams",
    description: "Create exam events, open marking windows, and close exams when papers are complete.",
    icon: FileText,
  },
];

export default function HeadteacherAssessmentHubPage() {
  return (
    <PageWrapper
      title="Assessment oversight"
      description="Monitor term assessments and formal exams across the school."
    >
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        Teachers enter marks on their portals. Use this hub to see submission progress, unlock locked CBC sheets, and
        manage the exam lifecycle.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LINKS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group block h-full">
            <div className="h-full rounded-xl border border-border bg-card p-5 shadow-sm transition-ui group-hover:border-brand/40 group-hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
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
      <Card title="Quick actions">
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/headteacher/assessment/cbc"
              className="inline-flex items-center gap-2 font-medium text-brand hover:underline"
            >
              <Unlock className="h-4 w-4" />
              Unlock CBC submissions
            </Link>
          </li>
          <li>
            <Link href="/headteacher/reports" className="font-medium text-brand hover:underline">
              Review and approve report cards →
            </Link>
          </li>
          <li>
            <Link href="/headteacher/analytics" className="font-medium text-brand hover:underline">
              School-wide analytics →
            </Link>
          </li>
        </ul>
      </Card>
      </div>
    </PageWrapper>
  );
}
