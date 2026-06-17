"use client";

import { useEffect, useState } from "react";
import { CbcScoreGrid } from "@/components/assessment/CbcScoreGrid";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { apiGet } from "@/lib/api";

type IdName = {
  id: string;
  name?: string;
  studentNumber?: string;
  fullName?: string;
  classId?: string | null;
};
type Year = { id: string; name: string };
type Term = { id: string; academicYearId: string; termNumber: number };
type ClassRow = { id: string; name: string; stream: string; academicYearId: string };
type SubjectAssignment = { subjectId: string; subjectName: string; subjectCode: string };
type Strand = { id: string; name: string; subStrands: { id: string; name: string }[] };

export default function AdminCbcAssessmentPage() {
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [strandId, setStrandId] = useState("");
  const [years, setYears] = useState<Year[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectAssignment[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [students, setStudents] = useState<{ id: string; fullName: string; studentNumber: string }[]>(
    [],
  );
  const [strand, setStrand] = useState<Strand | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const [y, t, c] = await Promise.all([
        apiGet<Year[]>("/academic/years"),
        apiGet<Term[]>("/academic/terms"),
        apiGet<ClassRow[]>("/academic/classes"),
      ]);
      setYears(y);
      setTerms(t);
      setClasses(c);
      const nextYearId = academicYearId || y[0]?.id || "";
      setAcademicYearId(nextYearId);
      const classOpts = c.filter((x) => x.academicYearId === nextYearId);
      const nextClassId = classOpts.some((x) => x.id === classId) ? classId : classOpts[0]?.id || "";
      setClassId(nextClassId);
      const termOpts = t.filter((x) => x.academicYearId === nextYearId);
      const nextTermId = termOpts.some((x) => x.id === termId) ? termId : termOpts[0]?.id || "";
      setTermId(nextTermId);
      const classSubjects = nextClassId
        ? await apiGet<SubjectAssignment[]>(
            `/academic/class-subjects?classId=${encodeURIComponent(nextClassId)}&academicYearId=${encodeURIComponent(nextYearId)}`,
          )
        : [];
      const uniqueSubjects = classSubjects.filter(
        (x, idx, arr) => arr.findIndex((k) => k.subjectId === x.subjectId) === idx,
      );
      setSubjects(uniqueSubjects);
      const nextSubjectId = uniqueSubjects.some((x) => x.subjectId === subjectId)
        ? subjectId
        : uniqueSubjects[0]?.subjectId || "";
      setSubjectId(nextSubjectId);
      const strandRows = nextSubjectId
        ? await apiGet<Strand[]>(`/academic/cbc-strands?subjectId=${encodeURIComponent(nextSubjectId)}`)
        : [];
      setStrands(strandRows);
      const nextStrandId = strandRows.some((x) => x.id === strandId) ? strandId : strandRows[0]?.id || "";
      setStrandId(nextStrandId);
      const stu = nextClassId
        ? await apiGet<IdName[]>(`/students?classId=${encodeURIComponent(nextClassId)}`)
        : [];
      setStudents(
        stu.map((s) => ({
          id: s.id,
          fullName: String(s.fullName ?? ""),
          studentNumber: String(s.studentNumber ?? ""),
        })),
      );
      const picked = strandRows.find((x) => x.id === nextStrandId) ?? null;
      setStrand(picked);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- manual reload
  }, []);

  return (
    <PageWrapper title="CBC assessment" description="Enter A–E competency ratings per strand">
      <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Select
          label="Academic year"
          options={years.map((y) => ({ value: y.id, label: y.name }))}
          value={academicYearId}
          onChange={(e) => setAcademicYearId(e.target.value)}
        />
        <Select
          label="Class"
          options={classes.filter((x) => x.academicYearId === academicYearId).map((x) => ({ value: x.id, label: `${x.name} ${x.stream}` }))}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        />
        <Select
          label="Term"
          options={terms.filter((x) => x.academicYearId === academicYearId).map((x) => ({ value: x.id, label: `Term ${x.termNumber}` }))}
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
        />
        <Select
          label="Subject"
          options={subjects.map((x) => ({ value: x.subjectId, label: `${x.subjectCode} - ${x.subjectName}` }))}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        />
        <Select
          label="Strand"
          options={strands.map((x) => ({ value: x.id, label: x.name }))}
          value={strandId}
          onChange={(e) => setStrandId(e.target.value)}
        />
      </div>
      <Button onClick={() => void load()} loading={loading}>
        Reload data
      </Button>
      {err ? <div className="mt-4"><Alert tone="error">{err}</Alert></div> : null}
      {strand && termId && subjectId ? (
        <div className="mt-8">
          <CbcScoreGrid
            students={students}
            competencies={strand.subStrands.map((s) => s.name)}
            subjectId={subjectId}
            strandId={strand.id}
            termId={termId}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Select year, class, term, subject, and strand to enable CBC score entry.
        </p>
      )}
    </PageWrapper>
  );
}
