"use client";

import {
  ArrowRight,
  BarChart3,
  FileText,
  GraduationCap,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { CompetencyLevelBadge } from "@/components/cbc/CompetencyLevelBadge";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import {
  LetterGradeDescriptorProvider,
  useLetterGradeDescriptors,
} from "@/contexts/LetterGradeDescriptorContext";
import { manualStatus } from "@/lib/queryStatus";
import { GuideWorkflowAccordion } from "./GuideWorkflowAccordion";
import {
  ACHIEVEMENT_PLAIN_MEANINGS,
  buildAdminSteps,
  buildHeadteacherSteps,
  buildTeacherSteps,
  CA_EOC_SPLIT_LABEL,
  CERTIFICATION_OUTCOMES,
  GUIDE_FAQ,
  GUIDE_ROLE_LABELS,
  type GuideWorkflowRole,
} from "./guideContent";

export type AssessmentGuideViewerRole = "admin" | "headteacher" | "subject-teacher" | "class-teacher";

function defaultWorkflowRole(viewer: AssessmentGuideViewerRole): GuideWorkflowRole {
  if (viewer === "admin") return "admin";
  if (viewer === "headteacher") return "headteacher";
  return "teacher";
}

function guideHrefForViewer(viewer: AssessmentGuideViewerRole): string {
  switch (viewer) {
    case "admin":
      return "/admin/assessment/guide";
    case "headteacher":
      return "/headteacher/assessment/guide";
    case "class-teacher":
      return "/class-teacher/assessment/guide";
    default:
      return "/subject-teacher/assessment/guide";
  }
}

function hubHrefForViewer(viewer: AssessmentGuideViewerRole): string | null {
  switch (viewer) {
    case "admin":
      return "/admin/assessment";
    case "headteacher":
      return "/headteacher/assessment";
    case "class-teacher":
    case "subject-teacher":
      return null;
    default:
      return null;
  }
}

function TwoTrackOverview() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Term grades combine compulsory <strong className="font-medium text-foreground">exam averages</strong> with
        optional <strong className="font-medium text-foreground">project work</strong> when your school enables it.
        Both map to the same A–E scale on report cards.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 transition-ui hover:bg-blue-500/10">
          <div className="mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <FileText className="h-5 w-5" aria-hidden />
            <h3 className="font-semibold">Exams (compulsory average)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Admin creates multiple exams per term. Teachers enter marks; compulsory papers are averaged per subject.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 transition-ui hover:bg-emerald-500/10">
          <div className="mb-2 flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
            <BarChart3 className="h-5 w-5" aria-hidden />
            <h3 className="font-semibold">Project work (optional blend)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            When enabled, project scores blend with the exam average ({CA_EOC_SPLIT_LABEL}) for the final A–E grade.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          How they relate
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="rounded-md border border-border bg-card px-3 py-2 text-center text-xs font-medium shadow-sm">
            Activity A–E ratings
            <span className="mt-0.5 block text-muted-foreground">→ term summaries</span>
          </div>
          <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden />
          <div className="rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-center text-xs font-medium shadow-sm">
            Report card
            <span className="mt-0.5 block text-muted-foreground">strand lines + subject grade</span>
          </div>
          <ArrowRight className="hidden h-4 w-4 rotate-180 text-muted-foreground sm:block sm:rotate-0" aria-hidden />
          <div className="rounded-md border border-border bg-card px-3 py-2 text-center text-xs font-medium shadow-sm">
            Project CA + Exam EOC
            <span className="mt-0.5 block text-muted-foreground">→ composite A–E</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementScaleReference() {
  const { grades, uiByGrade, isLoading } = useLetterGradeDescriptors();
  const status = manualStatus({
    loading: isLoading,
    error: null,
    data: grades,
  });

  return (
    <AsyncContent
      status={status}
      loading={<FormSkeleton fields={5} />}
      error={<ErrorState message="Could not load achievement scale descriptors." />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grades.map((letter) => (
          <div
            key={letter}
            className="rounded-lg border border-border bg-card p-3 transition-ui hover:bg-accent/30"
          >
            <CompetencyLevelBadge grade={letter} size="md" />
            <p className="mt-2 text-sm text-muted-foreground">
              {ACHIEVEMENT_PLAIN_MEANINGS[letter] ?? uiByGrade[letter].descriptor}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Descriptor words ({grades.map((g) => uiByGrade[g].descriptor).join(", ")}) come from your school&apos;s grading
        scales configuration and may differ from the defaults above.
      </p>
    </AsyncContent>
  );
}

function CertificationExplainer() {
  const toneClass = {
    success: "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10",
    warning: "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10",
    danger: "border-red-500/40 bg-red-500/5 hover:bg-red-500/10",
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {CERTIFICATION_OUTCOMES.map((outcome) => (
        <div
          key={outcome.code}
          className={`rounded-lg border p-4 transition-ui ${toneClass[outcome.tone]}`}
        >
          <h3 className="font-semibold text-foreground">{outcome.label}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {outcome.conditions.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-foreground/60">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {GUIDE_FAQ.map((item, index) => {
        const open = openIndex === index;
        return (
          <div
            key={item.question}
            className={`rounded-lg border border-border bg-card transition-ui ${open ? "ring-1 ring-brand/15" : "hover:bg-accent/30"}`}
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-ui hover:bg-accent/40"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <span className="font-medium text-foreground">{item.question}</span>
              <HelpCircle
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "text-brand" : ""}`}
                aria-hidden
              />
            </button>
            {open ? (
              <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{item.answer}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AssessmentGuideBody({
  viewerRole,
  teacherBase,
}: {
  viewerRole: AssessmentGuideViewerRole;
  teacherBase: "/subject-teacher" | "/class-teacher";
}) {
  const [workflowRole, setWorkflowRole] = useState<GuideWorkflowRole>(() => defaultWorkflowRole(viewerRole));

  const steps = useMemo(() => {
    if (workflowRole === "admin") return buildAdminSteps();
    if (workflowRole === "headteacher") return buildHeadteacherSteps();
    return buildTeacherSteps(teacherBase);
  }, [workflowRole, teacherBase]);

  const hubHref = hubHrefForViewer(viewerRole);

  return (
    <div className="space-y-8">
      {hubHref ? (
        <p className="-mt-2 text-sm text-muted-foreground">
          <Link href={hubHref} className="font-medium text-brand hover:underline">
            ← Back to assessment hub
          </Link>
        </p>
      ) : null}

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" aria-hidden />
          <h2 className="text-lg font-semibold">How term grades work</h2>
        </div>
        <TwoTrackOverview />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="text-lg font-semibold">Step-by-step workflow</h2>
          </div>
          <div
            className="inline-flex rounded-lg border border-border bg-muted/40 p-1"
            role="tablist"
            aria-label="Workflow role"
          >
            {(["admin", "teacher", "headteacher"] as const).map((role) => (
              <button
                key={role}
                type="button"
                role="tab"
                aria-selected={workflowRole === role}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-ui ${
                  workflowRole === role
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setWorkflowRole(role)}
              >
                {GUIDE_ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {workflowRole === "teacher"
            ? "Subject teachers and class teachers use the same entry screens for their assigned subjects."
            : workflowRole === "admin"
              ? "Configure structure, policy, and monitoring before teachers enter marks."
              : "Review aggregated competency data and certification before report cards are issued."}
        </p>
        <GuideWorkflowAccordion steps={steps} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">The achievement scale (A–E)</h2>
        <AchievementScaleReference />
      </Card>

      {CERTIFICATION_OUTCOMES.length > 0 ? (
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Certification (Result 1 / 2 / 3)</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          UCE certification is computed from certified composite grades and official project-work completion.
        </p>
        <CertificationExplainer />
      </Card>
      ) : null}

      <Card>
        <h2 className="mb-4 text-lg font-semibold">FAQ &amp; troubleshooting</h2>
        <FaqAccordion />
      </Card>
    </div>
  );
}

export function AssessmentGuidePage({ viewerRole }: { viewerRole: AssessmentGuideViewerRole }) {
  const pathname = usePathname();
  const teacherBase: "/subject-teacher" | "/class-teacher" = pathname.includes("/class-teacher/")
    ? "/class-teacher"
    : "/subject-teacher";

  return (
    <PageWrapper
      title="How assessment works"
      description="Interactive guide to competency assessment, CA & grading, and UCE certification in SchoolManage."
    >
      <LetterGradeDescriptorProvider>
        <AssessmentGuideBody viewerRole={viewerRole} teacherBase={teacherBase} />
      </LetterGradeDescriptorProvider>
    </PageWrapper>
  );
}

export function AssessmentGuidePromo({
  viewerRole,
  className = "",
}: {
  viewerRole: AssessmentGuideViewerRole;
  className?: string;
}) {
  const href = guideHrefForViewer(viewerRole);
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-medium text-brand transition-ui hover:bg-brand/10 ${className}`}
    >
      <HelpCircle className="h-4 w-4" aria-hidden />
      How does this work?
    </Link>
  );
}
