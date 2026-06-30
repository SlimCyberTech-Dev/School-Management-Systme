import PDFDocument from "pdfkit";
import { PassThrough, type Readable } from "stream";
import { getCbcDescriptorStatic } from "./grading";
import {
  drawCommentBlocks,
  drawDataTable,
  drawReportFooter,
  drawReportFrame,
  drawReportHeader,
  drawSectionTitle,
  drawStudentIdentityBlock,
  drawSummaryStrip,
  formatPercent,
  PDF_MARGIN,
  type ReportBranding,
  type ReportLayoutOptions,
} from "./pdf/reportCardLayout";

function createReportDoc(): InstanceType<typeof PDFDocument> {
  return new PDFDocument({
    size: "LETTER",
    margin: PDF_MARGIN,
    info: {
      Title: "Report Card",
      Author: process.env.SCHOOL_NAME ?? "School Management System",
    },
  });
}

export function streamCbcReportCard(data: {
  schoolName: string;
  studentName: string;
  studentNumber: string;
  className: string;
  stream: string;
  term: string;
  year: string;
  photoPath?: string | null;
  subjects: { name: string; strand: string; competency: string; rating: string; descriptor?: string }[];
  formalExam?: {
    examName: string;
    maxScore: number;
    subjects: { name: string; code: string; score: number; grade: string; maxScore: number }[];
  };
  subjectSummaries?: {
    code: string;
    name: string;
    finalGrade: string | null;
    caScore: number | null;
    eocScore: number | null;
    composite: number | null;
    projectStatus: string | null;
  }[];
  certification?: {
    resultCode: string;
    label: string;
    reasonLabels: string[];
  };
  daysAttended: number;
  totalDays: number;
  teacherComment: string;
  headteacherComment: string;
  motto?: string | null;
  branding?: ReportBranding;
  layout?: ReportLayoutOptions;
  ranking?: { positionDisplay: string; aggregateLabel: string };
}): Readable {
  const doc = createReportDoc();
  const pass = new PassThrough();
  doc.pipe(pass);
  const schoolName = data.schoolName?.trim() || "School Report";

  drawReportFrame(doc);

  const classLabel = [data.className, data.stream].filter(Boolean).join(" · ");
  const identityRows: { label: string; value: string }[] = [
    { label: "Class", value: classLabel || "—" },
    { label: "Term", value: data.term },
    { label: "Year", value: data.year },
  ];
  if (data.ranking) {
    identityRows.push({
      label: "Class position",
      value: `${data.ranking.positionDisplay} · ${data.ranking.aggregateLabel}`,
    });
  }
  identityRows.push({
    label: "Attendance",
    value: `${data.daysAttended} / ${data.totalDays} days (${formatPercent(data.daysAttended, data.totalDays)})`,
  });

  let y = drawReportHeader(doc, {
    schoolName,
    subtitle: "O-Level CBC Report Card",
    termLine: `${data.term} · Academic year ${data.year}`,
    motto: data.motto,
    branding: data.branding,
    layout: data.layout,
  });

  y = drawStudentIdentityBlock(doc, y, {
    studentName: data.studentName,
    studentNumber: data.studentNumber,
    photoUrl: data.photoPath,
    layout: data.layout,
    rows: identityRows,
  });

  if (data.subjects.length > 0) {
    y = drawSectionTitle(doc, y, "Term competency assessment (CBC)");
    const cols = [
      { header: "Subject", width: 95 },
      { header: "Strand", width: 75 },
      { header: "Competency", width: 130 },
      { header: "Rating", width: 42, align: "center" as const },
      { header: "Descriptor", width: 118 },
    ];
    const rows = data.subjects.map((s) => [
      s.name,
      s.strand,
      s.competency,
      s.rating,
      s.descriptor || getCbcDescriptorStatic(s.rating) || "—",
    ]);
    y = drawDataTable(doc, y, cols, rows, {
      rowHeight: 16,
      fontSize: 7.5,
      branding: data.branding,
      layout: data.layout,
    });
  } else {
    y = drawSectionTitle(doc, y, "Term competency assessment (CBC)");
    doc.fillColor("#64748B").font("Helvetica").fontSize(9);
    doc.text("No competency ratings recorded for this term.", PDF_MARGIN, y);
    y += 22;
  }

  if (data.formalExam && data.formalExam.subjects.length > 0) {
    y = drawSectionTitle(doc, y, `Formal examination — ${data.formalExam.examName}`);
    y = drawSummaryStrip(
      doc,
      y,
      [
      { label: "Exam", value: data.formalExam.examName },
      { label: "Maximum score", value: String(data.formalExam.maxScore) },
      { label: "Papers", value: String(data.formalExam.subjects.length) },
      ],
      data.branding,
    );

    const examCols = [
      { header: "Subject", width: 150 },
      { header: "Code", width: 55, align: "center" as const },
      { header: "Score", width: 70, align: "center" as const },
      { header: "Grade", width: 50, align: "center" as const },
      { header: "Out of", width: 55, align: "center" as const },
    ];
    const examRows = data.formalExam.subjects.map((s) => [
      s.name,
      s.code,
      String(s.score),
      s.grade,
      String(s.maxScore),
    ]);
    y = drawDataTable(doc, y, examCols, examRows, { branding: data.branding, layout: data.layout });
  }

  if (data.subjectSummaries && data.subjectSummaries.length > 0) {
    y = drawSectionTitle(doc, y, "Subject final grades (CA 20% + EOC 80%)");
    const sumCols = [
      { header: "Subject", width: 120 },
      { header: "CA %", width: 45, align: "center" as const },
      { header: "EOC %", width: 45, align: "center" as const },
      { header: "Composite", width: 55, align: "center" as const },
      { header: "Grade", width: 40, align: "center" as const },
      { header: "Project", width: 60, align: "center" as const },
    ];
    const sumRows = data.subjectSummaries.map((s) => [
      s.name,
      s.caScore != null ? String(s.caScore) : "—",
      s.eocScore != null ? String(s.eocScore) : "—",
      s.composite != null ? String(s.composite) : "—",
      s.finalGrade ?? "—",
      s.projectStatus ?? "—",
    ]);
    y = drawDataTable(doc, y, sumCols, sumRows, { branding: data.branding, layout: data.layout });
  }

  if (data.certification) {
    y = drawSectionTitle(doc, y, "UCE certification");
    y = drawSummaryStrip(
      doc,
      y,
      [{ label: "Status", value: data.certification.label }],
      data.branding,
    );
    if (data.certification.reasonLabels.length > 0) {
      doc.fillColor("#64748B").font("Helvetica").fontSize(8);
      doc.text(`Reasons: ${data.certification.reasonLabels.join("; ")}`, PDF_MARGIN, y);
      y += 18;
    }
  }

  y = drawSectionTitle(doc, y, "Comments");
  y = drawCommentBlocks(
    doc,
    y,
    [
      { title: "Class teacher", text: data.teacherComment },
      { title: "Headteacher", text: data.headteacherComment },
    ],
    data.branding,
  );

  drawReportFooter(
    doc,
    y,
    `Official school report · ${data.studentName} (${data.studentNumber}) · Generated ${new Date().toLocaleDateString("en-UG", { dateStyle: "medium" })}`,
    data.branding,
  );

  doc.end();
  return pass;
}

export function streamAlevelReportCard(data: {
  schoolName: string;
  studentName: string;
  studentNumber: string;
  className: string;
  combination: string;
  term: string;
  year: string;
  photoPath?: string | null;
  sourceExamName?: string;
  subjects: { name: string; code?: string; score: string; grade: string; points: number }[];
  totalPoints: number | null;
  division: string | null;
  teacherComment: string;
  headteacherRemark: string;
  motto?: string | null;
  branding?: ReportBranding;
  layout?: ReportLayoutOptions;
  ranking?: { positionDisplay: string; aggregateLabel: string };
}): Readable {
  const doc = createReportDoc();
  const pass = new PassThrough();
  doc.pipe(pass);
  const schoolName = data.schoolName?.trim() || "School Report";

  drawReportFrame(doc);

  const identityRows: { label: string; value: string }[] = [
    { label: "Class", value: data.className || "—" },
    { label: "Combination", value: data.combination || "—" },
    { label: "Term", value: data.term },
    { label: "Year", value: data.year },
  ];
  if (data.ranking) {
    identityRows.push({
      label: "Class position",
      value: `${data.ranking.positionDisplay} · ${data.ranking.aggregateLabel}`,
    });
  }

  let y = drawReportHeader(doc, {
    schoolName,
    subtitle: "A-Level UNEB Report Card",
    termLine: `${data.term} · Academic year ${data.year}`,
    motto: data.motto,
    branding: data.branding,
    layout: data.layout,
  });

  y = drawStudentIdentityBlock(doc, y, {
    studentName: data.studentName,
    studentNumber: data.studentNumber,
    photoUrl: data.photoPath,
    layout: data.layout,
    rows: identityRows,
  });

  if (data.sourceExamName) {
    doc.fillColor("#64748B").font("Helvetica-Oblique").fontSize(8);
    doc.text(`Scores compiled from formal exam: ${data.sourceExamName}`, PDF_MARGIN, y, {
      width: 520,
      align: "center",
    });
    y += 18;
  }

  if (data.subjects.length > 0) {
    y = drawSectionTitle(doc, y, "Subject performance");
    const cols = [
      { header: "Subject", width: 155 },
      { header: "Code", width: 50, align: "center" as const },
      { header: "Score", width: 55, align: "center" as const },
      { header: "Grade", width: 50, align: "center" as const },
      { header: "Points", width: 50, align: "center" as const },
    ];
    const rows = data.subjects.map((s) => [
      s.name,
      s.code ?? "—",
      s.score,
      s.grade,
      String(s.points),
    ]);
    y = drawDataTable(doc, y, cols, rows, { branding: data.branding, layout: data.layout });
  } else {
    y = drawSectionTitle(doc, y, "Subject performance");
    doc.fillColor("#64748B").font("Helvetica").fontSize(9);
    doc.text("No subject scores recorded for this term.", PDF_MARGIN, y);
    y += 22;
  }

  const summaryCells: { label: string; value: string }[] = [
    { label: "Total points (best 3)", value: data.totalPoints != null ? String(data.totalPoints) : "—" },
    { label: "Division", value: data.division ?? "—" },
    { label: "Subjects", value: String(data.subjects.length) },
  ];
  if (data.ranking) {
    summaryCells.unshift({
      label: "Class position",
      value: data.ranking.positionDisplay,
    });
  }
  y = drawSummaryStrip(doc, y, summaryCells, data.branding);

  y = drawSectionTitle(doc, y, "Comments");
  y = drawCommentBlocks(
    doc,
    y,
    [
      { title: "Class teacher", text: data.teacherComment },
      { title: "Headteacher", text: data.headteacherRemark },
    ],
    data.branding,
  );

  drawReportFooter(
    doc,
    y,
    `Official school report · ${data.studentName} (${data.studentNumber}) · Generated ${new Date().toLocaleDateString("en-UG", { dateStyle: "medium" })}`,
    data.branding,
  );

  doc.end();
  return pass;
}
