import type { ReportRankingSnapshot } from "@uganda-cbc-sms/shared";

export const REPORT_PAYLOAD_VERSION = 2;

export type { ReportRankingSnapshot };

export type ReportSourceType = "term" | "exam";

export type ReportFormalExamLine = {
  name: string;
  code: string;
  score: number;
  grade: string;
  points: number | null;
  maxScore: number;
};

export type ReportFormalExamSection = {
  examId: string;
  examName: string;
  maxScore: number;
  subjects: ReportFormalExamLine[];
};

export type CbcReportSubjectLine = {
  name: string;
  code: string;
  strand: string;
  competency: string;
  rating: string;
  descriptor: string;
};

export type CbcReportPayload = {
  version: typeof REPORT_PAYLOAD_VERSION;
  schoolName: string;
  studentName: string;
  studentNumber: string;
  className: string;
  stream: string;
  termLabel: string;
  yearName: string;
  photoUrl: string | null;
  subjects: CbcReportSubjectLine[];
  daysAttended: number;
  totalDays: number;
  teacherComment: string;
  headteacherComment: string;
  /** Class position after batch report generation (competition ranking). */
  ranking?: ReportRankingSnapshot;
  /** Present when generated with a linked formal exam (CBC annex). */
  formalExam?: ReportFormalExamSection;
  /** Snapshot metadata — set at generation time. */
  sourceType?: ReportSourceType;
  sourceExamId?: string;
  sourceExamName?: string;
  generatedAt?: string;
};

export type AlevelReportSubjectLine = {
  name: string;
  code: string;
  score: number;
  grade: string;
  points: number;
};

export type AlevelReportPayload = {
  version: typeof REPORT_PAYLOAD_VERSION;
  schoolName: string;
  studentName: string;
  studentNumber: string;
  className: string;
  combination: string;
  termLabel: string;
  yearName: string;
  photoUrl?: string | null;
  subjects: AlevelReportSubjectLine[];
  totalPoints: number;
  division: string;
  teacherComment: string;
  headteacherRemark: string;
  ranking?: ReportRankingSnapshot;
  sourceType?: ReportSourceType;
  /** Set when report scores were compiled from a formal exam. */
  sourceExamId?: string;
  sourceExamName?: string;
  generatedAt?: string;
};

export type ReportTrack = "cbc" | "alevel";
