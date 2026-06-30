import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarRange,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers,
  PenLine,
  Scale,
  School,
  Settings2,
  Users,
} from "lucide-react";
import { DEFAULT_ASSESSMENT_CONFIG } from "@uganda-cbc-sms/shared";

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

export const ACHIEVEMENT_PLAIN_MEANINGS: Record<string, string> = {
  A: "Demonstrates mastery well beyond the expected standard.",
  B: "Consistently performs above the expected standard.",
  C: "Meets the expected standard.",
  D: "Approaches the standard; may need additional support.",
  E: "Beginning to develop the expected skills; foundational work in progress.",
};

const { caWeight, eocWeight } = DEFAULT_ASSESSMENT_CONFIG;
const caPct = Math.round(caWeight * 100);
const eocPct = Math.round(eocWeight * 100);

export const CA_EOC_SPLIT_LABEL = `${caPct}% project work + ${eocPct}% exam average`;

export function buildAdminSteps(): GuideStep[] {
  return [
    {
      id: "structure",
      title: "Set up academic structure",
      description: "Create academic years, terms, and classes.",
      icon: CalendarRange,
      href: "/admin/academic/structure",
    },
    {
      id: "assignments",
      title: "Assign subjects and teachers",
      description: "Link subjects to classes and assign subject teachers on the timetable.",
      icon: Users,
      href: "/admin/academic/assignments",
    },
    {
      id: "exams",
      title: "Create term exams",
      description: "Create one or more exams per class and term. Mark compulsory papers for the term average.",
      icon: FileText,
      href: "/admin/exams",
    },
    {
      id: "grading",
      title: "Configure term grade policy",
      description: `Set project/exam weights (${CA_EOC_SPLIT_LABEL}) and whether project work is included.`,
      icon: Scale,
      href: "/admin/assessment/rules",
    },
    {
      id: "descriptors",
      title: "Configure A–E grading scales",
      description: "Set score bands and descriptor wording (Exceptional, Outstanding, etc.).",
      icon: Settings2,
      href: "/admin/academic/grading-scales",
    },
    {
      id: "setup-status",
      title: "Monitor setup status",
      description: "Confirm structure, assignments, and policy before teachers enter marks.",
      icon: ClipboardCheck,
      href: "/admin/academic/setup",
    },
  ];
}

export function buildTeacherSteps(teacherBase: "/subject-teacher" | "/class-teacher"): GuideStep[] {
  return [
    {
      id: "exams",
      title: "Enter exam marks",
      description: "Open each exam under Exams and enter marks for your subject. Compulsory exams feed the term average.",
      icon: PenLine,
      href: `${teacherBase}/exams`,
    },
    {
      id: "project-work",
      title: "Record project work (optional)",
      description: "When enabled by school policy, project scores are blended with exam averages for the term grade.",
      icon: BarChart3,
      href: `${teacherBase}/assessment/project-work`,
    },
  ];
}

export function buildHeadteacherSteps(): GuideStep[] {
  return [
    {
      id: "oversight",
      title: "Review exam submission status",
      description: "Check that teachers have submitted marks for all compulsory exam papers.",
      icon: GraduationCap,
      href: "/headteacher/exams",
    },
    {
      id: "reports",
      title: "Generate and approve report cards",
      description: "Term reports show C1…Cn exam columns, average, and A–E grade per subject.",
      icon: School,
      href: "/headteacher/reports",
    },
  ];
}

export const CERTIFICATION_OUTCOMES: Array<{
  code: string;
  label: string;
  tone: "success" | "warning" | "danger";
  conditions: string[];
}> = [];

export const GUIDE_FAQ: GuideFaqItem[] = [
  {
    question: "Why is a subject missing from my teacher list?",
    answer:
      "You are not assigned to teach that subject on the timetable. Ask an admin to check teaching assignments.",
  },
  {
    question: "How is the term grade calculated?",
    answer: `The system averages compulsory exam marks (as percentages) for the term. When project work is enabled, the final score uses a weighted blend (${CA_EOC_SPLIT_LABEL}). The result maps to A–E using your school's grading scales.`,
  },
  {
    question: "Why can't I edit exam marks?",
    answer:
      "The exam may be closed or your paper submission is locked. Contact an admin to reopen if needed.",
  },
  {
    question: "What's the difference between exams and project work?",
    answer:
      "Exam marks come from formal exams you create per term. Project work is separate continuous assessment entry, blended into the term grade only when school policy enables it.",
  },
];

export const GUIDE_ROLE_LABELS: Record<GuideWorkflowRole, string> = {
  admin: "Admin",
  teacher: "Teacher",
  headteacher: "Headteacher",
};
