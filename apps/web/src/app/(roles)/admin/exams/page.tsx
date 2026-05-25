"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { createExamSchema } from "@uganda-cbc-sms/shared";
import type { AcademicYear, ExamSummary, SchoolClass, Term } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { ExamStatusBadge } from "@/components/exams/ExamStatusBadge";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Spinner } from "@/components/feedback/Spinner";
import { TableSkeleton } from "@/components/feedback/TableSkeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { useExamAdminActions, useExamsList } from "@/hooks/useExams";
import { apiGet } from "@/lib/api";
import { combineQueryStatus, queryStatus } from "@/lib/queryStatus";
import { getApiErrorMessage } from "@/lib/api";

type CreateForm = z.infer<typeof createExamSchema>;

type ClassSubjectRow = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
};

export default function AdminExamsPage() {
  const [yearId, setYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string }>({});

  const [yearsQ, termsQ, classesQ] = useQueries({
    queries: [
      { queryKey: ["academic-years"], queryFn: () => apiGet<AcademicYear[]>("/academic/years") },
      {
        queryKey: ["academic-terms", yearId],
        queryFn: () => apiGet<Term[]>(`/academic/terms?academicYearId=${encodeURIComponent(yearId)}`),
        enabled: Boolean(yearId),
      },
      { queryKey: ["academic-classes"], queryFn: () => apiGet<SchoolClass[]>("/academic/classes") },
    ],
  });

  const examsQ = useExamsList({
    academicYearId: yearId || undefined,
    termId: termId || undefined,
    classId: classId || undefined,
    status: status || undefined,
  });

  const actions = useExamAdminActions();
  const years = yearsQ.data ?? [];
  const terms = termsQ.data ?? [];
  const classes = classesQ.data ?? [];

  const form = useForm<CreateForm>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      name: "",
      academicYearId: "",
      termId: "",
      classId: "",
      examDate: "",
      maxScore: 100,
      subjectIds: [],
    },
  });

  const createYearId = form.watch("academicYearId");
  const createClassId = form.watch("classId");

  const createTermsQ = useQuery({
    queryKey: ["academic-terms", "create-exam", createYearId],
    queryFn: () => apiGet<Term[]>(`/academic/terms?academicYearId=${encodeURIComponent(createYearId)}`),
    enabled: createOpen && Boolean(createYearId),
  });

  const classSubjectsQ = useQuery({
    queryKey: ["class-subjects", "create-exam", createClassId, createYearId],
    queryFn: () =>
      apiGet<ClassSubjectRow[]>(
        `/academic/class-subjects?classId=${encodeURIComponent(createClassId)}&academicYearId=${encodeURIComponent(createYearId)}`,
      ),
    enabled: createOpen && Boolean(createClassId && createYearId),
  });

  const createTerms = createTermsQ.data ?? [];

  const classesForCreate = useMemo(
    () => classes.filter((c) => c.academicYearId === createYearId),
    [classes, createYearId],
  );

  const examSubjectOptions = useMemo(() => {
    const rows = classSubjectsQ.data ?? [];
    const seen = new Set<string>();
    const out: ClassSubjectRow[] = [];
    for (const r of rows) {
      if (!r.subjectId || seen.has(r.subjectId)) continue;
      seen.add(r.subjectId);
      out.push(r);
    }
    return out.sort((a, b) => `${a.subjectCode}`.localeCompare(`${b.subjectCode}`));
  }, [classSubjectsQ.data]);

  useEffect(() => {
    if (years[0] && !yearId) setYearId(years[0].id);
  }, [years, yearId]);

  useEffect(() => {
    if (termId && terms.length && !terms.some((t) => t.id === termId)) setTermId("");
  }, [terms, termId]);

  const openCreateModal = () => {
    const defaultYear = yearId || years[0]?.id || "";
    const yearClasses = classes.filter((c) => c.academicYearId === defaultYear);
    const defaultClass =
      classId && yearClasses.some((c) => c.id === classId) ? classId : yearClasses[0]?.id ?? "";

    form.reset({
      name: "",
      academicYearId: defaultYear,
      termId: termId || "",
      classId: defaultClass,
      examDate: "",
      maxScore: 100,
      subjectIds: [],
    });
    setCreateOpen(true);
  };

  useEffect(() => {
    if (!createOpen || !createYearId) return;
    const valid = classes.filter((c) => c.academicYearId === createYearId);
    const current = form.getValues("classId");
    if (!current || !valid.some((c) => c.id === current)) {
      const pick =
        classId && valid.some((c) => c.id === classId) ? classId : valid[0]?.id ?? "";
      form.setValue("classId", pick, { shouldValidate: false });
      form.setValue("subjectIds", [], { shouldValidate: false });
    }
  }, [createOpen, createYearId, classes, classId, form]);

  useEffect(() => {
    if (!createOpen || !createYearId || createTermsQ.isLoading) return;
    const termList = createTermsQ.data ?? [];
    const current = form.getValues("termId");
    if (!termList.length) {
      if (current) form.setValue("termId", "", { shouldValidate: false });
      return;
    }
    if (!current || !termList.some((t) => t.id === current)) {
      const pick =
        termId && termList.some((t) => t.id === termId) ? termId : termList[0]!.id;
      form.setValue("termId", pick, { shouldValidate: false });
    }
  }, [createOpen, createYearId, createTermsQ.data, createTermsQ.isLoading, termId, form]);

  const filteredClasses = useMemo(
    () => (yearId ? classes.filter((c) => c.academicYearId === yearId) : classes),
    [classes, yearId],
  );

  const listStatus = queryStatus(examsQ);
  const metaStatus = combineQueryStatus([yearsQ, classesQ]);
  const tableStatus = metaStatus === "loading" ? "loading" : listStatus;
  const tableError =
    examsQ.error instanceof Error
      ? examsQ.error.message
      : yearsQ.error instanceof Error
        ? yearsQ.error.message
        : "We couldn't load exams. Please try again.";

  const columns: Column<ExamSummary>[] = [
    {
      key: "name",
      header: "Exam",
      render: (r) => (
        <Link className="font-medium text-brand underline" href={`/admin/exams/${r.id}`}>
          {r.name}
        </Link>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (r) => (
        <span>
          {r.className}
          {r.classStream ? ` · ${r.classStream}` : ""}
        </span>
      ),
    },
    { key: "date", header: "Date", render: (r) => r.examDate ?? "—" },
    { key: "max", header: "Max", render: (r) => String(r.maxScore) },
    { key: "subjects", header: "Subjects", render: (r) => String(r.subjectCount ?? "—") },
    { key: "status", header: "Status", render: (r) => <ExamStatusBadge status={r.status} /> },
  ];

  const onCreate = async (v: CreateForm) => {
    setFeedback({});
    try {
      const created = await actions.create.mutateAsync(v);
      setFeedback({ ok: `"${created.name}" was created as a draft. Open it when teachers should enter marks.` });
      setCreateOpen(false);
      form.reset({
        name: "",
        academicYearId: years[0]?.id ?? "",
        termId: "",
        classId: "",
        examDate: "",
        maxScore: 100,
        subjectIds: [],
      });
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  const subjectsReady = Boolean(createYearId && createClassId);
  const subjectsLoading = subjectsReady && classSubjectsQ.isLoading;
  const subjectsLoadError = classSubjectsQ.isError
    ? classSubjectsQ.error instanceof Error
      ? classSubjectsQ.error.message
      : "We couldn't load subjects for this class."
    : null;

  return (
    <PageWrapper
      title="Exams"
      description="Create formal exams, open them for teachers to enter marks, then close when complete."
    >
      {feedback.ok ? <Alert tone="success">{feedback.ok}</Alert> : null}
      {feedback.err ? <Alert tone="error">{feedback.err}</Alert> : null}

      <div className="mb-6">
      <Card title="Filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Academic year"
            options={years.map((y) => ({ value: y.id, label: y.name }))}
            value={yearId}
            onChange={(e) => {
              setYearId(e.target.value);
              setTermId("");
            }}
          />
          <Select
            label="Term"
            options={
              terms.length
                ? terms.map((t) => ({ value: t.id, label: `Term ${t.termNumber}` }))
                : [{ value: "", label: "Select a year first" }]
            }
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
          />
          <Select
            label="Class"
            options={[
              { value: "", label: "All classes" },
              ...filteredClasses.map((c) => ({
                value: c.id,
                label: `${c.name}${c.stream ? ` · ${c.stream}` : ""}`,
              })),
            ]}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
          <Select
            label="Status"
            options={[
              { value: "", label: "All statuses" },
              { value: "draft", label: "Draft" },
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
      </Card>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={openCreateModal}>Create exam</Button>
      </div>

      <AsyncContent
        status={tableStatus}
        loading={<TableSkeleton rows={6} cols={5} />}
        error={<ErrorState message={tableError} onRetry={() => void examsQ.refetch()} />}
      >
        <Table
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          rows={(examsQ.data ?? []) as unknown as Record<string, unknown>[]}
          emptyState={
            <EmptyState
              title="No exams yet"
              description="Create an exam for a class and term, then open it when teachers should enter marks."
            />
          }
        />
      </AsyncContent>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create exam">
        <form className="space-y-4" onSubmit={form.handleSubmit(onCreate)}>
          <Input label="Exam name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Academic year"
              options={years.map((y) => ({ value: y.id, label: y.name }))}
              value={form.watch("academicYearId")}
              onChange={(e) => {
                const y = e.target.value;
                const nextClasses = classes.filter((c) => c.academicYearId === y);
                form.setValue("academicYearId", y);
                form.setValue("termId", "");
                form.setValue("classId", nextClasses[0]?.id ?? "");
                form.setValue("subjectIds", [], { shouldValidate: true });
              }}
            />
            <Select
              label="Term"
              options={
                createTerms.length
                  ? createTerms.map((t) => ({ value: t.id, label: `Term ${t.termNumber}` }))
                  : [{ value: "", label: "Select year first" }]
              }
              value={form.watch("termId")}
              onChange={(e) => form.setValue("termId", e.target.value)}
            />
          </div>
          <Select
            label="Class"
            options={
              classesForCreate.length
                ? classesForCreate.map((c) => ({
                    value: c.id,
                    label: `${c.name}${c.stream ? ` · ${c.stream}` : ""}`,
                  }))
                : [{ value: "", label: createYearId ? "No classes for this year" : "Select academic year first" }]
            }
            value={form.watch("classId")}
            onChange={(e) => {
              form.setValue("classId", e.target.value);
              form.setValue("subjectIds", [], { shouldValidate: true });
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Exam date (optional)" type="date" {...form.register("examDate")} />
            <Input
              label="Maximum score"
              type="number"
              min={1}
              max={1000}
              {...form.register("maxScore")}
              error={form.formState.errors.maxScore?.message}
            />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Subjects on this exam</p>
              {examSubjectOptions.length > 0 ? (
                <Controller
                  name="subjectIds"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        className="text-brand underline"
                        onClick={() =>
                          field.onChange(examSubjectOptions.map((s) => s.subjectId))
                        }
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground underline"
                        onClick={() => field.onChange([])}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                />
              ) : null}
            </div>
            {!subjectsReady ? (
              <p className="text-sm text-muted-foreground">
                Select an academic year and class to load subjects assigned to that class.
              </p>
            ) : subjectsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" />
                Loading subjects…
              </div>
            ) : subjectsLoadError ? (
              <p className="text-sm text-red-600">{subjectsLoadError}</p>
            ) : examSubjectOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No subjects are assigned to this class for the selected year.{" "}
                <Link href="/admin/academic/class-subjects" className="text-brand underline">
                  Assign subjects in Academic → Class subjects
                </Link>{" "}
                (choose the same year and class), then return here.
              </p>
            ) : (
              <Controller
                name="subjectIds"
                control={form.control}
                render={({ field }) => (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-border p-3">
                    {examSubjectOptions.map((cs) => {
                      const checked = (field.value ?? []).includes(cs.subjectId);
                      return (
                        <label
                          key={cs.subjectId}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border accent-brand"
                            checked={checked}
                            onChange={() => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? current.filter((id) => id !== cs.subjectId)
                                  : [...current, cs.subjectId],
                              );
                            }}
                          />
                          <span>
                            {cs.subjectCode} — {cs.subjectName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            )}
            {form.formState.errors.subjectIds?.message ? (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.subjectIds.message}</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actions.create.isPending}>
              Save draft
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
