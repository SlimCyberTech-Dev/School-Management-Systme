"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import type { AcademicYear, ExamSummary, SchoolClass, Term } from "@uganda-cbc-sms/shared";
import { AdminExamFormModal } from "@/components/exams/AdminExamFormModal";
import { AdminExamRowActions } from "@/components/exams/AdminExamRowActions";
import { ExamStatusBadge } from "@/components/exams/ExamStatusBadge";
import { ExamWorkflowGuide } from "@/components/exams/ExamWorkflowGuide";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TableSkeleton } from "@/components/feedback/TableSkeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { useExam, useExamAdminActions, useExamsList } from "@/hooks/useExams";
import { apiGet, getApiErrorMessage } from "@/lib/api";
import { examArchiveDialogCopy, examArchiveSuccessMessage } from "@/lib/examDeleteCopy";
import { combineQueryStatus, queryStatus } from "@/lib/queryStatus";

export default function AdminExamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "archived" ? "archived" : "active";

  const [yearId, setYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editExamId, setEditExamId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ExamSummary | null>(null);
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
    status: tab === "active" ? statusFilter || undefined : undefined,
    archivedOnly: tab === "archived",
  });

  const editExamQ = useExam(editExamId ?? undefined);
  const actions = useExamAdminActions();
  const years = yearsQ.data ?? [];
  const terms = termsQ.data ?? [];
  const classes = classesQ.data ?? [];

  useEffect(() => {
    if (years[0] && !yearId) setYearId(years[0].id);
  }, [years, yearId]);

  useEffect(() => {
    if (termId && terms.length && !terms.some((t) => t.id === termId)) setTermId("");
  }, [terms, termId]);

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

  const setTab = (next: "active" | "archived") => {
    const qp = new URLSearchParams(searchParams.toString());
    if (next === "archived") qp.set("tab", "archived");
    else qp.delete("tab");
    router.replace(`/admin/exams${qp.toString() ? `?${qp}` : ""}`);
  };

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setFeedback({});
    try {
      await fn();
      setFeedback({ ok: label });
    } catch (e) {
      setFeedback({ err: getApiErrorMessage(e) });
    }
  };

  const columns: Column<ExamSummary>[] = [
    {
      key: "name",
      header: "Exam",
      render: (r) => (
        <Link
          className="font-medium text-brand underline"
          href={`/admin/exams/${r.id}${r.isArchived ? "?archived=1" : ""}`}
        >
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
    {
      key: "actions",
      header: "",
      render: (r) => (
        <AdminExamRowActions
          exam={r}
          archivedView={tab === "archived"}
          busy={
            actions.open.isPending ||
            actions.close.isPending ||
            actions.reopen.isPending ||
            actions.archive.isPending
          }
          onEdit={(exam) => {
            setEditExamId(exam.id);
            setFormMode("edit");
          }}
          onArchive={setArchiveTarget}
          onOpen={(exam) =>
            void runAction(`"${exam.name}" is open for marking.`, () => actions.open.mutateAsync(exam.id))
          }
          onClose={(exam) =>
            void runAction(`"${exam.name}" was closed.`, () => actions.close.mutateAsync({ id: exam.id }))
          }
          onReopen={(exam) =>
            void runAction(`"${exam.name}" was reopened.`, () => actions.reopen.mutateAsync(exam.id))
          }
        />
      ),
    },
  ];

  const formOpen = formMode !== null;
  const editExam = formMode === "edit" ? editExamQ.data : undefined;
  const editReady = formMode !== "edit" || Boolean(editExam);

  return (
    <PageWrapper
      title="Exams"
      description="Formal assessments: plan, open for teacher marking, close when complete, then link to report cards"
    >
      {feedback.ok ? <Alert tone="success">{feedback.ok}</Alert> : null}
      {feedback.err ? <Alert tone="error">{feedback.err}</Alert> : null}

      <div className="mb-6 space-y-4">
        <ExamWorkflowGuide />
        <Card title="Filters">
          <div className="mb-3 flex gap-2 border-b border-border pb-3">
            <Button
              type="button"
              variant={tab === "active" ? "primary" : "secondary"}
              className="!px-3 !py-1.5 text-sm"
              onClick={() => setTab("active")}
            >
              Active exams
            </Button>
            <Button
              type="button"
              variant={tab === "archived" ? "primary" : "secondary"}
              className="!px-3 !py-1.5 text-sm"
              onClick={() => setTab("archived")}
            >
              Archived
            </Button>
          </div>
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
            {tab === "active" ? (
              <Select
                label="Status"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "open", label: "Open (marking)" },
                  { value: "closed", label: "Closed" },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            ) : (
              <div className="flex items-end text-sm text-muted-foreground">Archived exams only</div>
            )}
          </div>
        </Card>
      </div>

      {tab === "active" ? (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setFormMode("create")}>Create exam</Button>
        </div>
      ) : null}

      <AsyncContent
        status={tableStatus}
        loading={<TableSkeleton rows={6} cols={6} />}
        error={<ErrorState message={tableError} onRetry={() => void examsQ.refetch()} />}
      >
        <Table
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          rows={(examsQ.data ?? []) as unknown as Record<string, unknown>[]}
          emptyState={
            <EmptyState
              title={tab === "archived" ? "No archived exams" : "No exams yet"}
              description={
                tab === "archived"
                  ? "Archived exams appear here. Archive an active exam when it should no longer be used."
                  : "Create an exam for a class and term, then open it when teachers should enter marks."
              }
            />
          }
        />
      </AsyncContent>

      {formOpen && editReady ? (
        <AdminExamFormModal
          mode={formMode === "edit" ? "edit" : "create"}
          open={formOpen}
          onClose={() => {
            setFormMode(null);
            setEditExamId(null);
          }}
          exam={editExam}
          defaultYearId={yearId}
          defaultTermId={termId}
          defaultClassId={classId}
          onSuccess={(msg) => setFeedback({ ok: msg })}
          onError={(msg) => setFeedback({ err: msg })}
          onCreated={(created) => {
            router.push(`/admin/exams/${created.id}?edit=0`);
          }}
        />
      ) : formMode === "edit" && editExamQ.isError ? (
        <Alert tone="error">
          {editExamQ.error instanceof Error ? editExamQ.error.message : "Could not load exam to edit."}
        </Alert>
      ) : null}

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title={archiveTarget ? examArchiveDialogCopy(archiveTarget).title : "Archive this exam?"}
        description={archiveTarget ? examArchiveDialogCopy(archiveTarget).description : ""}
        confirmLabel="Archive"
        danger
        loading={actions.archive.isPending}
        onConfirm={() => {
          if (!archiveTarget) return;
          const target = archiveTarget;
          void runAction(examArchiveSuccessMessage(target), async () => {
            await actions.archive.mutateAsync(target.id);
          });
          setArchiveTarget(null);
        }}
        onCancel={() => setArchiveTarget(null)}
      />
    </PageWrapper>
  );
}
