import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers,
  Lock,
  PenLine,
  Scale,
  School,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DEFAULT_ASSESSMENT_CONFIG, OLEVEL_CERTIFICATION_LABELS } from "@uganda-cbc-sms/shared";

export type GuideWorkflowRole = "admin" | "teacher" | "headteacher";

export type GuideStep = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

export type GuideFaqItem = {
  question: string;
  answer: string;
};

/** Plain-English achievement meanings (scale reference — descriptors come from tenant config). */
export const ACHIEVEMENT_PLAIN_MEANINGS: Record<string, string> = {
  A: "Demonstrates mastery well beyond the expected standard for this competency.",
  B: "Consistently performs above the expected standard.",
  C: "Meets the expected standard for this competency.",
  D: "Approaches the standard; may need additional support.",
  E: "Beginning to develop the competency; foundational skills emerging.",
};

const { caWeight, eocWeight, minimumSubjects, qualifyingGradeMin } = DEFAULT_ASSESSMENT_CONFIG;
const caPct = Math.round(caWeight * 100);
const eocPct = Math.round(eocWeight * 100);

export const CA_EOC_SPLIT_LABEL = `${caPct}% project work (CA) + ${eocPct}% exam (EOC)`;

export function buildAdminSteps(): GuideStep[] {
  return [
    {
      id: "structure",
      title: "Set up academic structure",
      description: "Create academic years, terms, and classes so assessment is scoped to the right cohort.",
      icon: CalendarRange,
      href: "/admin/academic/structure",
    },
    {
      id: "assignments",
      title: "Assign subjects and teachers to classes",
      description:
        "Link subjects to each class, then assign subject teachers (and class teachers) on the timetable.",
      icon: Users,
      href: "/admin/academic/assignments",
    },
    {
      id: "strands",
      title: "Configure CBC strands and competencies",
      description: "Define strands and competencies per subject so teachers can rate learners on the A–E scale.",
      icon: Layers,
      href: "/admin/academic/cbc-strands",
    },
    {
      id: "grading",
      title: "Configure grading policy",
      description: `Set CA/EOC weights (${CA_EOC_SPLIT_LABEL}), achievement-level descriptor wording, and cut-points.`,
      icon: Scale,
      href: "/admin/assessment/rules",
    },
    {
      id: "descriptors",
      title: "Customize A–E descriptor wording",
      description: "Adjust how each letter grade is labelled on reports (Exceptional, Outstanding, etc.).",
      icon: Settings2,
      href: "/admin/academic/grading-scales",
    },
    {
      id: "setup-status",
      title: "Monitor setup status",
      description: "Use the checklist to confirm structure, assignments, strands, and policy are ready before teachers enter marks.",
      icon: ClipboardCheck,
      href: "/admin/academic/setup",
    },
  ];
}

export function buildTeacherSteps(teacherBase: "/subject-teacher" | "/class-teacher"): GuideStep[] {
  const assignments = `${teacherBase}/assessment/cbc`;
  const entry = `${teacherBase}/assessment/cbc/entry`;
  const exams = `${teacherBase}/exams`;

  return [
    {
      id: "create-activity",
      title: "Create an assessment activity",
      description:
        "From your assignments, open Enter → Activities & ratings. Add an activity (test, practical, project, etc.) with a title and date.",
      icon: PenLine,
      href: assignments,
    },
    {
      id: "rate",
      title: "Rate learner competencies (A–E)",
      description:
        "In the ratings grid, assign UNEB A–E achievement grades per learner and competency for the selected activity.",
      icon: ClipboardCheck,
      href: entry,
    },
    {
      id: "lock",
      title: "Lock the activity when done",
      description:
        "Locking finalizes ratings for that event and feeds term-summary aggregation. Locked activities are view-only for teachers.",
      icon: Lock,
      href: entry,
    },
    {
      id: "project-work",
      title: "Record project work scores (feeds CA)",
      description:
        "On the Project work (official CA) tab, enter scored project work per learner. This drives the 20% continuous assessment component.",
      icon: BarChart3,
      href: `${entry}?tab=projects`,
    },
    {
      id: "outcomes",
      title: "Add learning outcomes",
      description: "Track strand-level learning outcomes and record achievement grades with optional remarks.",
      icon: BookOpen,
      href: `${entry}?tab=outcomes`,
    },
    {
      id: "exams",
      title: "Enter exam marks (EOC)",
      description: `Enter end-of-cycle exam marks under Exams. EOC combines with project CA (${CA_EOC_SPLIT_LABEL}) for the certified subject grade.`,
      icon: FileText,
      href: exams,
    },
  ];
}

export function buildHeadteacherSteps(): GuideStep[] {
  return [
    {
      id: "summaries",
      title: "Review term competency summaries",
      description:
        "Open competency assessment for a class and term. Summaries aggregate A–E ratings across all activities per competency.",
      icon: GraduationCap,
      href: "/headteacher/assessment/cbc",
    },
    {
      id: "override",
      title: "Override a rating when needed",
      description:
        "When professional judgement differs from the aggregated grade, apply an override with a required justification.",
      icon: ShieldCheck,
      href: "/headteacher/assessment/cbc",
    },
    {
      id: "certification",
      title: "Review certification status (Result 1/2/3)",
      description:
        "Before report cards go out, confirm each learner's UCE certification outcome on Reports.",
      icon: Award,
      href: "/headteacher/reports",
    },
  ];
}

export const CERTIFICATION_OUTCOMES = [
  {
    code: "RESULT_1" as const,
    label: OLEVEL_CERTIFICATION_LABELS.RESULT_1,
    tone: "success" as const,
    conditions: [
      `At least one subject at ${qualifyingGradeMin} or better`,
      `At least ${minimumSubjects} subjects with final grades`,
      "All compulsory subjects sat",
      "Official project-work CA complete for every subject (not provisional strand-only CA)",
    ],
  },
  {
    code: "RESULT_2" as const,
    label: OLEVEL_CERTIFICATION_LABELS.RESULT_2,
    tone: "warning" as const,
    conditions: [
      "Does not meet all Result 1 requirements",
      "Not every subject at grade E",
      "Common blockers: missing compulsory subject, fewer than 8 subjects, incomplete project work, or no qualifying grade",
    ],
  },
  {
    code: "RESULT_3" as const,
    label: OLEVEL_CERTIFICATION_LABELS.RESULT_3,
    tone: "danger" as const,
    conditions: ["Every sat subject is at grade E"],
  },
];

export const GUIDE_FAQ: GuideFaqItem[] = [
  {
    question: "Why is my term summary empty?",
    answer:
      "No competency ratings were saved for that learner, subject, and term. Create an assessment activity, enter A–E grades, save, and ensure the activity is not still draft-only in your session.",
  },
  {
    question: "Why is a subject missing from my teacher list?",
    answer:
      "You are not assigned to teach that subject on the class timetable. Ask an admin to check Class subjects and Subject teachers under Academic.",
  },
  {
    question: "Why are there no competencies in the ratings grid?",
    answer:
      "CBC strands may not be configured for that subject, or competency IDs could not be resolved. An admin should verify CBC strands; at least one saved rating or imported summary may be needed for ID resolution.",
  },
  {
    question: "Why can't I edit a locked activity?",
    answer:
      "Locking is intentional — ratings are final for that event and feed term summaries. Create a new activity for additional evidence, or contact the headteacher for legacy sheet unlock (pre-migration flow only).",
  },
  {
    question: "What's the difference between competency ratings and project work?",
    answer:
      "Competency ratings (Activities & ratings) are formative A–E tracking per competency on each activity. Project work (official CA) is scored continuous assessment that feeds the 20% CA component of the certified composite grade — separate from the competency grid.",
  },
  {
    question: "Why does project CA show as incomplete on reports?",
    answer:
      "Required project slots are missing or scores were not entered on the Project work tab. Admins can verify expected projects per term under assessment rules / CA policy.",
  },
];

export const GUIDE_ROLE_LABELS: Record<GuideWorkflowRole, string> = {
  admin: "Admin",
  teacher: "Teacher",
  headteacher: "Headteacher",
};
