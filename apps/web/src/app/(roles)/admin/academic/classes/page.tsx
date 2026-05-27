"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { AcademicLevelScope } from "@/components/academic/AcademicLevelScope";
import { useAcademicLevelScope } from "@/hooks/useAcademicLevelScope";
import { filterClassesByLevel, levelShortLabel } from "@/lib/academicLevel";
import { useQueries } from "@tanstack/react-query";
import { School } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useForm } from "react-hook-form";
import { classSchema } from "@uganda-cbc-sms/shared";
import type { AcademicYear, SchoolClass } from "@uganda-cbc-sms/shared";
import type { TeachingStaffMember } from "@/hooks/useTeachingStaff";
import type { z } from "zod";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

type Form = z.infer<typeof classSchema>;
type Row = SchoolClass & Record<string, unknown>;
const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAcademicClassesPage() {
  const { level, setLevel, hrefWithLevel } = useAcademicLevelScope("O_LEVEL");
  const [classesQ, yearsQ, staffQ] = useQueries({
    queries: [
      { queryKey: ["academic-classes"], queryFn: () => apiGet<SchoolClass[]>("/academic/classes") },
      { queryKey: ["academic-years"], queryFn: () => apiGet<AcademicYear[]>("/academic/years") },
      { queryKey: ["teaching-staff"], queryFn: () => apiGet<TeachingStaffMember[]>("/academic/teaching-staff") },
    ],
  });
  const classes = useMemo(() => classesQ.data ?? [], [classesQ.data]);
  const years = useMemo(() => yearsQ.data ?? [], [yearsQ.data]);
  const users = useMemo(() => staffQ.data ?? [], [staffQ.data]);
  const scopedClasses = useMemo(() => filterClassesByLevel(classes, level), [classes, level]);
  const loading = [classesQ, yearsQ, staffQ].some((q) => q.isPending);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SchoolClass | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      stream: "",
      level: "O_LEVEL",
      academicYearId: "",
      classTeacherId: null,
    },
  });
  const editForm = useForm<Form>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      stream: "",
      level: "O_LEVEL",
      academicYearId: "",
      classTeacherId: null,
    },
  });

  const reload = () => {
    void classesQ.refetch();
    void yearsQ.refetch();
    void staffQ.refetch();
  };

  useEffect(() => {
    if (years[0] && !form.getValues("academicYearId")) {
      form.setValue("academicYearId", years[0].id);
    }
  }, [years, form]);

  useEffect(() => {
    form.setValue("level", level);
  }, [level, form]);

  const onSubmit = async (v: Form) => {
    setErr(null);
    setOk(null);
    try {
      await apiPost("/academic/classes", { ...v, classTeacherId: null });
      reload();
      setOk("Class created.");
      setCreateOpen(false);
      form.reset({
        name: "",
        stream: "",
        level: "O_LEVEL",
        academicYearId: years[0]?.id ?? "",
        classTeacherId: null,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const startEdit = (row: SchoolClass) => {
    setEditing(row);
    editForm.reset({
      name: row.name,
      stream: row.stream,
      level: row.level,
      academicYearId: row.academicYearId,
      classTeacherId: row.classTeacherId,
    });
  };

  const onEdit = async (v: Form) => {
    if (!editing) return;
    setErr(null);
    setOk(null);
    setBusyId(editing.id);
    try {
      await apiPatch(`/academic/classes/${encodeURIComponent(editing.id)}`, {
        name: v.name,
        stream: v.stream,
        level: v.level,
        academicYearId: v.academicYearId,
      });
      reload();
      setEditing(null);
      setOk("Class updated.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setErr(null);
    setOk(null);
    setBusyId(confirmDelete.id);
    try {
      await apiDelete(`/academic/classes/${encodeURIComponent(confirmDelete.id)}`);
      reload();
      setConfirmDelete(null);
      setOk("Class deleted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "Class" },
    { key: "stream", header: "Stream" },
    { key: "level", header: "Level" },
    {
      key: "academicYearId",
      header: "Year",
      render: (r) => years.find((y) => y.id === r.academicYearId)?.name ?? "—",
    },
    {
      key: "classTeacherId",
      header: "Homeroom",
      render: (r) => {
        const name = users.find((u) => u.id === r.classTeacherId)?.fullName;
        return name ? (
          name
        ) : (
          <span className="text-amber-700 dark:text-amber-300">Not set</span>
        );
      },
    },
    {
      key: "manage",
      header: "",
      render: (r) => (
        <Link
          href={hrefWithLevel("/admin/academic/class-teachers", {
            classId: r.id,
            academicYearId: r.academicYearId,
          })}
          className="text-sm font-medium text-brand hover:underline"
        >
          Class teachers
        </Link>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-3">
          <button
            type="button"
            className={ACTION_BTN}
            disabled={busyId === r.id}
            onClick={() => startEdit(r)}
          >
            Edit
          </button>
          <button
            type="button"
            className={ACTION_DANGER_BTN}
            disabled={busyId === r.id}
            onClick={() => setConfirmDelete(r)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Classes" description="Create O-Level and A-Level class groups — assign teachers on Class teachers">
      <div className="mb-3">
        <Link href="/admin/academic" className="text-sm font-medium text-brand hover:underline">
          ← Back to Academic
        </Link>
      </div>
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
      <div className="mb-4">
        <Card title="School level">
          <AcademicLevelScope
            level={level}
            onLevelChange={setLevel}
            description={`Showing ${levelShortLabel(level)} classes. Homeroom is assigned under Class teachers, not here.`}
          />
        </Card>
      </div>
      <Card title={`Classes (${scopedClasses.length})`}>
        <div className="mb-3 flex justify-end">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Add new record
          </Button>
        </div>
        <Table
          columns={columns}
          rows={scopedClasses as Row[]}
          loading={loading}
          searchKeys={["name", "stream"]}
          emptyState={
            <EmptyState
              title="No classes configured"
              description="Add classes for each stream and academic year."
              icon={School}
              action={{ label: "Add class", onClick: () => setCreateOpen(true) }}
            />
          }
        />
      </Card>
      <Modal open={Boolean(editing)} title={`Edit class${editing ? `: ${editing.name} ${editing.stream}` : ""}`} onClose={() => setEditing(null)}>
          <form className="mt-1 space-y-3" onSubmit={editForm.handleSubmit(onEdit)}>
            <Input label="Name" {...editForm.register("name")} error={editForm.formState.errors.name?.message} />
            <Input label="Stream" {...editForm.register("stream")} error={editForm.formState.errors.stream?.message} />
            <Select
              label="Level"
              options={[
                { value: "O_LEVEL", label: "O-Level / CBC" },
                { value: "A_LEVEL", label: "A-Level" },
              ]}
              {...editForm.register("level")}
            />
            <Select
              label="Academic year"
              options={years.map((y) => ({ value: y.id, label: y.name }))}
              {...editForm.register("academicYearId")}
            />
            <p className="text-sm text-muted-foreground">
              Assign homeroom and class teachers on{" "}
              <Link
                href={hrefWithLevel(
                  "/admin/academic/class-teachers",
                  editing
                    ? {
                        classId: editing.id,
                        academicYearId: editing.academicYearId,
                      }
                    : undefined,
                )}
                className="font-medium text-brand hover:underline"
              >
                Class teachers
              </Link>
              .
            </p>
            <div className="flex gap-2">
              <Button type="submit" loading={Boolean(editing && busyId === editing.id)}>
                Save changes
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete class?"
        description="This cannot be undone. If linked students/records exist, deletion will be blocked."
        confirmLabel="Delete"
        danger
        loading={Boolean(confirmDelete && busyId === confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
      />
      <Modal open={createOpen} title="New class" onClose={() => setCreateOpen(false)}>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Input label="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <Input label="Stream" {...form.register("stream")} error={form.formState.errors.stream?.message} />
          <Select
            label="Level"
            options={[
              { value: "O_LEVEL", label: "O-Level / CBC" },
              { value: "A_LEVEL", label: "A-Level" },
            ]}
            {...form.register("level")}
          />
          <Select
            label="Academic year"
            options={years.map((y) => ({ value: y.id, label: y.name }))}
            {...form.register("academicYearId")}
          />
          <p className="text-sm text-muted-foreground">
            After creating the class, assign homeroom on{" "}
            <Link href={hrefWithLevel("/admin/academic/class-teachers")} className="font-medium text-brand hover:underline">
              Class teachers
            </Link>
            .
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create class</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
