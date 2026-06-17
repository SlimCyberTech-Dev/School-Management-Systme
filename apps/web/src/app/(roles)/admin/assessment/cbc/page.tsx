"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SchoolClass, Student } from "@uganda-cbc-sms/shared";
import { CbcScoreGrid } from "@/components/assessment/CbcScoreGrid";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { apiGet } from "@/lib/api";
import {
  filterClassesByLevel,
  pickDefaultAcademicYear,
  pickDefaultTerm,
} from "@/lib/academicLevel";
import { manualStatus } from "@/lib/queryStatus";

type SubjectAssignment = { subjectId: string; subjectName: string; subjectCode: string };
type Strand = {
  id: string;
  name: string;
  subStrands?: { id: string; name: string }[];
  competencies?: string[];
};

function strandCompetencies(strand: Strand): string[] {
  if (strand.subStrands?.length) {
    return strand.subStrands.map((s) => s.name);
  }
  if (Array.isArray(strand.competencies)) {
    return strand.competencies.filter((c): c is string => typeof c === "string" && c.length > 0);
  }
  return [];
}

export default function AdminCbcAssessmentPage() {
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [strandId, setStrandId] = useState("");

  const yearsQ = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => apiGet<{ id: string; name: string; isActive?: boolean }[]>("/academic/years"),
  });
  const termsQ = useQuery({
    queryKey: ["academic-terms", academicYearId],
    queryFn: () =>
      apiGet<{ id: string; academicYearId: string; termNumber: number; isActive?: boolean }[]>(
        `/academic/terms?academicYearId=${encodeURIComponent(academicYearId)}`,
      ),
    enabled: Boolean(academicYearId),
  });
  const classesQ = useQuery({
    queryKey: ["academic-classes"],
    queryFn: () => apiGet<SchoolClass[]>("/academic/classes"),
  });

  const years = useMemo(() => yearsQ.data ?? [], [yearsQ.data]);
  const terms = useMemo(() => termsQ.data ?? [], [termsQ.data]);
  const classes = useMemo(() => classesQ.data ?? [], [classesQ.data]);

  useEffect(() => {
    if (!years.length || academicYearId) return;
    setAcademicYearId(pickDefaultAcademicYear(years));
  }, [years, academicYearId]);

  const oLevelClasses = useMemo(
    () => filterClassesByLevel(classes, "O_LEVEL", academicYearId),
    [classes, academicYearId],
  );

  useEffect(() => {
    if (!oLevelClasses.length) {
      if (classId) setClassId("");
      return;
    }
    if (!classId || !oLevelClasses.some((c) => c.id === classId)) {
      setClassId(oLevelClasses[0]!.id);
    }
  }, [oLevelClasses, classId]);

  const yearTerms = useMemo(
    () => terms.filter((t) => t.academicYearId === academicYearId),
    [terms, academicYearId],
  );

  useEffect(() => {
    if (!yearTerms.length) {
      if (termId) setTermId("");
      return;
    }
    const pick = pickDefaultTerm(yearTerms);
    if (!termId || !yearTerms.some((t) => t.id === termId)) {
      setTermId(pick?.id ?? "");
    }
  }, [yearTerms, termId]);

  const subjectsQ = useQuery({
    queryKey: ["admin-cbc-class-subjects", classId, academicYearId],
    queryFn: async () => {
      const rows = await apiGet<SubjectAssignment[]>(
        `/academic/class-subjects?classId=${encodeURIComponent(classId)}&academicYearId=${encodeURIComponent(academicYearId)}`,
      );
      return rows.filter(
        (x, idx, arr) => arr.findIndex((k) => k.subjectId === x.subjectId) === idx,
      );
    },
    enabled: Boolean(classId && academicYearId),
  });

  const subjects = useMemo(() => subjectsQ.data ?? [], [subjectsQ.data]);

  useEffect(() => {
    if (!subjects.length) {
      if (subjectId) setSubjectId("");
      return;
    }
    if (!subjectId || !subjects.some((s) => s.subjectId === subjectId)) {
      setSubjectId(subjects[0]!.subjectId);
    }
  }, [subjects, subjectId]);

  const strandsQ = useQuery({
    queryKey: ["assessment-strands", subjectId],
    queryFn: () =>
      apiGet<Strand[]>(`/assessments/strands?subjectId=${encodeURIComponent(subjectId)}`),
    enabled: Boolean(subjectId),
  });

  const strands = useMemo(() => strandsQ.data ?? [], [strandsQ.data]);

  useEffect(() => {
    if (!strands.length) {
      if (strandId) setStrandId("");
      return;
    }
    if (!strandId || !strands.some((s) => s.id === strandId)) {
      setStrandId(strands[0]!.id);
    }
  }, [strands, strandId]);

  const strand = useMemo(
    () => strands.find((s) => s.id === strandId) ?? null,
    [strands, strandId],
  );
  const competencies = strand ? strandCompetencies(strand) : [];

  const contextReady = Boolean(
    academicYearId && classId && termId && subjectId && strandId && competencies.length > 0,
  );

  const studentsQ = useQuery({
    queryKey: ["students", classId],
    queryFn: () => apiGet<Student[]>(`/students?classId=${encodeURIComponent(classId)}`),
    enabled: Boolean(classId),
  });

  const students = useMemo(
    () =>
      (studentsQ.data ?? []).map((s) => ({
        id: s.id,
        fullName: s.fullName,
        studentNumber: s.studentNumber,
      })),
    [studentsQ.data],
  );

  const filtersLoading = yearsQ.isLoading || classesQ.isLoading;
  const sheetStatus = manualStatus({
    loading: studentsQ.isLoading || subjectsQ.isLoading || strandsQ.isLoading,
    error: studentsQ.error ?? subjectsQ.error ?? strandsQ.error,
    data: contextReady ? students : undefined,
  });

  return (
    <PageWrapper title="CBC assessment" description="Enter A–E competency ratings per strand">
      <Link href="/admin/assessment" className="mb-4 inline-block text-sm font-medium text-brand hover:underline">
        ← Assessment hub
      </Link>

      <Card>
        <p className="text-sm text-muted-foreground">
          Defaults load from the active academic year, first O-Level class, and current term. Change any
          filter to switch context — data reloads automatically.
        </p>
      </Card>

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Select
          label="Academic year"
          options={years.map((y) => ({ value: y.id, label: y.name }))}
          value={academicYearId}
          onChange={(e) => setAcademicYearId(e.target.value)}
          disabled={filtersLoading}
        />
        <Select
          label="Class"
          options={oLevelClasses.map((x) => ({
            value: x.id,
            label: x.stream ? `${x.name} · ${x.stream}` : x.name,
          }))}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          disabled={filtersLoading || oLevelClasses.length === 0}
        />
        <Select
          label="Term"
          options={yearTerms.map((x) => ({ value: x.id, label: `Term ${x.termNumber}` }))}
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          disabled={!academicYearId || yearTerms.length === 0}
        />
        <Select
          label="Subject"
          options={subjects.map((x) => ({
            value: x.subjectId,
            label: `${x.subjectCode} — ${x.subjectName}`,
          }))}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={subjects.length === 0}
        />
        <Select
          label="Strand"
          options={strands.map((x) => ({ value: x.id, label: x.name }))}
          value={strandId}
          onChange={(e) => setStrandId(e.target.value)}
          disabled={strands.length === 0}
        />
      </div>

      {(yearsQ.error || classesQ.error) && (
        <div className="mt-4">
          <Alert tone="error">Could not load academic structure. Refresh the page.</Alert>
        </div>
      )}

      {!contextReady && sheetStatus !== "loading" ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {oLevelClasses.length === 0
            ? "No O-Level classes exist for the selected year."
            : subjects.length === 0
              ? "No subjects are assigned to this class. Add them under Academic → Class subjects."
              : strands.length === 0
                ? "No CBC strands for this subject. Configure them under Academic → CBC strands."
                : "This strand has no sub-strands or competencies configured."}
        </p>
      ) : (
        <div className="mt-8">
          <AsyncContent
            status={sheetStatus}
            loading={<FormSkeleton fields={6} />}
            error={
              <ErrorState
                message="We couldn't load students or strand data."
                onRetry={() => {
                  void studentsQ.refetch();
                  void strandsQ.refetch();
                  void subjectsQ.refetch();
                }}
              />
            }
          >
            {students.length === 0 ? (
              <Alert tone="info">No students are enrolled in this class.</Alert>
            ) : (
              <CbcScoreGrid
                students={students}
                competencies={competencies}
                subjectId={subjectId}
                strandId={strand!.id}
                termId={termId}
              />
            )}
          </AsyncContent>
        </div>
      )}
    </PageWrapper>
  );
}
