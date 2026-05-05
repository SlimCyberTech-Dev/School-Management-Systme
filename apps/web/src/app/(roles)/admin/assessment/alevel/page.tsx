"use client";

import { useEffect, useState } from "react";
import { ALevelScoreTable } from "@/components/assessment/ALevelScoreTable";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { apiGet } from "@/lib/api";

export default function AdminAlevelAssessmentPage() {
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [combinationId, setCombinationId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [years, setYears] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; academicYearId: string; termNumber: number }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; stream: string; academicYearId: string; level: string }[]>([]);
  const [combinations, setCombinations] = useState<
    { id: string; name: string; code: string; level: string; subjects: { id: string; name: string; code: string }[] }[]
  >([]);
  const [students, setStudents] = useState<
    { id: string; fullName: string; studentNumber: string }[]
  >([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const [y, t, c, k, stu] = await Promise.all([
        apiGet<{ id: string; name: string }[]>("/academic/years"),
        apiGet<{ id: string; academicYearId: string; termNumber: number }[]>("/academic/terms"),
        apiGet<{ id: string; name: string; stream: string; academicYearId: string; level: string }[]>("/academic/classes"),
        apiGet<{ id: string; name: string; code: string; level: string; subjects: { id: string; name: string; code: string }[] }[]>(
          "/academic/combinations?level=A_LEVEL",
        ),
        apiGet<{ id: string; fullName?: string; studentNumber?: string; classId?: string }[]>("/students"),
      ]);
      setYears(y);
      setTerms(t);
      setClasses(c);
      setCombinations(k);
      const nextYearId = academicYearId || y[0]?.id || "";
      setAcademicYearId(nextYearId);
      const classOpts = c.filter((x) => x.academicYearId === nextYearId && x.level === "A_LEVEL");
      const nextClassId = classOpts.some((x) => x.id === classId) ? classId : classOpts[0]?.id || "";
      setClassId(nextClassId);
      const termOpts = t.filter((x) => x.academicYearId === nextYearId);
      const nextTermId = termOpts.some((x) => x.id === termId) ? termId : termOpts[0]?.id || "";
      setTermId(nextTermId);
      const nextCombinationId = k.some((x) => x.id === combinationId) ? combinationId : k[0]?.id || "";
      setCombinationId(nextCombinationId);
      const combo = k.find((x) => x.id === nextCombinationId);
      const nextSubjectId =
        combo?.subjects.some((s) => s.id === subjectId) ? subjectId : combo?.subjects[0]?.id || "";
      setSubjectId(nextSubjectId);
      const filtered = nextClassId ? stu.filter((s) => s.classId === nextClassId) : stu;
      setStudents(
        filtered.map((s) => ({
          id: s.id,
          fullName: String(s.fullName ?? ""),
          studentNumber: String(s.studentNumber ?? ""),
        })),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on mount
  }, []);

  return (
    <PageWrapper title="A-Level assessment" description="UNEB scores (0–100)">
      <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Select
          label="Academic year"
          options={years.map((y) => ({ value: y.id, label: y.name }))}
          value={academicYearId}
          onChange={(e) => setAcademicYearId(e.target.value)}
        />
        <Select
          label="Class"
          options={classes.filter((x) => x.academicYearId === academicYearId && x.level === "A_LEVEL").map((x) => ({ value: x.id, label: `${x.name} ${x.stream}` }))}
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
          label="Subject combination"
          options={combinations.map((x) => ({ value: x.id, label: `${x.code} - ${x.name}` }))}
          value={combinationId}
          onChange={(e) => setCombinationId(e.target.value)}
        />
        <Select
          label="Subject"
          options={(combinations.find((x) => x.id === combinationId)?.subjects ?? []).map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        />
      </div>
      <Button onClick={() => void load()} loading={loading}>
        Reload students
      </Button>
      {err ? <div className="mt-4"><Alert tone="error">{err}</Alert></div> : null}
      {termId && subjectId ? (
        <div className="mt-8">
          <ALevelScoreTable students={students} subjectId={subjectId} termId={termId} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Select year, class, term, combination, and subject to enable entry.</p>
      )}
    </PageWrapper>
  );
}
