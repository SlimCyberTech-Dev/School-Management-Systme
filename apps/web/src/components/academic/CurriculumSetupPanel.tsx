"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AcademicYear,
  CurriculumSetupResult,
  CurriculumStatus,
  CurriculumTrack,
  SchoolClass,
} from "@uganda-cbc-sms/shared";
import {
  A_LEVEL_TRACK_SUBJECT_CODES,
  DEFAULT_O_LEVEL_SUBJECTS,
} from "@uganda-cbc-sms/shared";
import { AcademicLevelScope } from "@/components/academic/AcademicLevelScope";
import { useAcademicLevelScope } from "@/hooks/useAcademicLevelScope";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { classDisplayName, filterClassesByLevel, levelShortLabel } from "@/lib/academicLevel";
import { apiGet, apiPost, getApiErrorMessage } from "@/lib/api";
import { queryKeys, STRUCTURAL_STALE_MS } from "@/lib/queryKeys";
import { getApiTenantSlug } from "@/lib/tenantHost";
import { toast } from "@/lib/toast";

const TRACK_OPTIONS: Array<{ value: CurriculumTrack; label: string }> = [
  { value: "SCIENCES", label: "Sciences" },
  { value: "ARTS", label: "Arts" },
  { value: "GENERAL", label: "General" },
];

type Props = {
  compact?: boolean;
  initialYearId?: string;
};

export function CurriculumSetupPanel({ compact = false, initialYearId = "" }: Props) {
  const queryClient = useQueryClient();
  const tenantSlug = getApiTenantSlug();
  const { level, setLevel } = useAcademicLevelScope("O_LEVEL");
  const [academicYearId, setAcademicYearId] = useState(initialYearId);
  const [trackDraft, setTrackDraft] = useState<Record<string, CurriculumTrack | "">>({});
  const [confirmSetup, setConfirmSetup] = useState(false);

  const yearsQ = useQuery({
    queryKey: ["academic-years", tenantSlug],
    queryFn: () => apiGet<AcademicYear[]>("/academic/years"),
    staleTime: STRUCTURAL_STALE_MS,
  });

  const classesQ = useQuery({
    queryKey: ["academic-classes", tenantSlug],
    queryFn: () => apiGet<SchoolClass[]>("/academic/classes"),
    staleTime: STRUCTURAL_STALE_MS,
  });

  const years = yearsQ.data ?? [];
  const classes = classesQ.data ?? [];

  useEffect(() => {
    if (initialYearId) {
      setAcademicYearId(initialYearId);
      return;
    }
    if (!academicYearId && years[0]?.id) {
      setAcademicYearId(years[0].id);
    }
  }, [years, academicYearId, initialYearId]);

  const statusQ = useQuery({
    queryKey: queryKeys.curriculumStatus(tenantSlug, academicYearId),
    queryFn: () => apiGet<CurriculumStatus>(`/academic/curriculum/status?academicYearId=${encodeURIComponent(academicYearId)}`),
    enabled: Boolean(academicYearId),
    staleTime: 30_000,
  });

  const aLevelClasses = useMemo(
    () =>
      filterClassesByLevel(
        academicYearId ? classes.filter((c) => c.academicYearId === academicYearId) : classes,
        "A_LEVEL",
      ),
    [classes, academicYearId],
  );

  useEffect(() => {
    const next: Record<string, CurriculumTrack | ""> = {};
    for (const cls of aLevelClasses) {
      next[cls.id] = cls.curriculumTrack ?? "";
    }
    setTrackDraft(next);
  }, [aLevelClasses]);

  const trackDirty = useMemo(() => {
    return aLevelClasses.some((cls) => (trackDraft[cls.id] ?? "") !== (cls.curriculumTrack ?? ""));
  }, [aLevelClasses, trackDraft]);

  const setupMutation = useMutation({
    mutationFn: () =>
      apiPost<CurriculumSetupResult>("/academic/curriculum/setup", {
        academicYearId,
        level,
        installCatalog: true,
      }),
    onSuccess: (data) => {
      toast.success(
        `Added ${data.classSubjectsCreated} class–subject slots` +
          (data.subjectsCreated ? `; ${data.subjectsCreated} subjects in catalogue` : "") +
          (data.strandsCreated ? `; ${data.strandsCreated} CBC strands` : "") +
          (data.classesSkippedNoTrack
            ? `. ${data.classesSkippedNoTrack} A-Level class(es) skipped (no track).`
            : "."),
        "Curriculum provisioned",
      );
      void statusQ.refetch();
      void queryClient.invalidateQueries({ queryKey: queryKeys.academicSummary(tenantSlug) });
      void queryClient.invalidateQueries({ queryKey: ["academic-classes", tenantSlug] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), "Could not provision curriculum");
    },
  });

  const tracksMutation = useMutation({
    mutationFn: () => {
      const updates = aLevelClasses
        .filter((cls) => (trackDraft[cls.id] ?? "") !== (cls.curriculumTrack ?? ""))
        .map((cls) => ({
          classId: cls.id,
          curriculumTrack: trackDraft[cls.id] ? trackDraft[cls.id] : null,
        }));
      return apiPost<{ updated: number }>("/academic/curriculum/class-tracks", { updates });
    },
    onSuccess: (data) => {
      toast.success(`${data.updated} class track(s) saved.`, "Tracks updated");
      void classesQ.refetch();
      void statusQ.refetch();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), "Could not save tracks");
    },
  });

  const status = statusQ.data;
  const loading = yearsQ.isPending || (Boolean(academicYearId) && statusQ.isPending);
  const loadErr =
    yearsQ.error instanceof Error
      ? yearsQ.error.message
      : statusQ.error instanceof Error
        ? statusQ.error.message
        : null;

  const levelStatus = level === "O_LEVEL" ? status?.oLevel : status?.aLevel;
  const needsSetup =
    level === "O_LEVEL"
      ? Boolean(status && status.oLevel.classes > 0 && status.oLevel.classesFullyProvisioned < status.oLevel.classes)
      : Boolean(
          status &&
            (status.aLevel.classesMissingTrack > 0 ||
              status.aLevel.classesFullyProvisioned < status.aLevel.classes - status.aLevel.classesMissingTrack),
        );

  const yearOptions = years.map((y) => ({ value: y.id, label: y.name }));

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {!compact ? (
        <Card title="Curriculum automation">
          <p className="text-sm text-muted-foreground">
            Install the default subject catalogue, CBC strands (O-Level), and class–subject slots in one server-side
            operation. No bulk API calls from the browser — everything runs in a single request per action.
          </p>
        </Card>
      ) : null}

      <Card title={compact ? "Quick setup" : "Scope"}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Academic year</label>
              <Select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                options={yearOptions}
                disabled={!yearOptions.length}
              />
            </div>
            <AcademicLevelScope level={level} onLevelChange={setLevel} />
          </div>
          {!compact ? (
            <Link href="/admin/academic/class-subjects" className="text-sm font-medium text-brand hover:underline">
              Manual class subjects →
            </Link>
          ) : null}
        </div>
      </Card>

      {loading ? <p className="animate-pulse text-sm text-muted-foreground">Loading curriculum status…</p> : null}
      {loadErr ? <Alert tone="error">{loadErr}</Alert> : null}

      {status ? (
        <Card title={`${levelShortLabel(level)} status`}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Subject catalogue</dt>
              <dd className="font-medium">
                {level === "O_LEVEL"
                  ? `${status.catalog.oLevelSubjects} O-Level subjects · ${status.catalog.cbcStrands} CBC strands`
                  : `${status.catalog.aLevelSubjects} A-Level subjects`}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Classes in year</dt>
              <dd className="font-medium">{levelStatus?.classes ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Class–subject rows</dt>
              <dd className="font-medium">
                {"totalClassSubjectRows" in (levelStatus ?? {})
                  ? (levelStatus as { totalClassSubjectRows: number }).totalClassSubjectRows
                  : 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fully provisioned</dt>
              <dd className="font-medium">
                {level === "O_LEVEL"
                  ? `${status.oLevel.classesFullyProvisioned} / ${status.oLevel.classes}`
                  : `${status.aLevel.classesFullyProvisioned} / ${Math.max(0, status.aLevel.classes - status.aLevel.classesMissingTrack)}`}
              </dd>
            </div>
          </dl>

          {level === "O_LEVEL" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Each O-Level class receives all {DEFAULT_O_LEVEL_SUBJECTS.length} default subjects plus shared CBC strands
              for assessment entry.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              A-Level classes need a track before provisioning. Sciences:{" "}
              {A_LEVEL_TRACK_SUBJECT_CODES.SCIENCES.join(", ")}. Arts: {A_LEVEL_TRACK_SUBJECT_CODES.ARTS.join(", ")}.
            </p>
          )}

          {needsSetup ? (
            <div className="mt-4">
              <Alert tone="info">
                {level === "A_LEVEL" && status.aLevel.classesMissingTrack > 0
                  ? `${status.aLevel.classesMissingTrack} A-Level class(es) have no track — set tracks below, then provision.`
                  : "Some classes are missing subject slots. Run setup to fill them automatically."}
              </Alert>
            </div>
          ) : null}
        </Card>
      ) : null}

      {level === "A_LEVEL" && aLevelClasses.length > 0 ? (
        <Card title="A-Level tracks">
          <p className="mb-4 text-sm text-muted-foreground">
            Assign Sciences or Arts (or General) per class. Save tracks in one request, then provision subjects.
          </p>
          <div className="space-y-2">
            {aLevelClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium">{classDisplayName(cls)}</span>
                <Select
                  className="sm:max-w-[180px]"
                  value={trackDraft[cls.id] ?? ""}
                  onChange={(e) =>
                    setTrackDraft((prev) => ({
                      ...prev,
                      [cls.id]: e.target.value as CurriculumTrack | "",
                    }))
                  }
                  options={[
                    { value: "", label: "— Select track —" },
                    ...TRACK_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                  ]}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!trackDirty || tracksMutation.isPending}
              onClick={() => tracksMutation.mutate()}
            >
              {tracksMutation.isPending ? "Saving…" : "Save all tracks"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card title="Provision">
        <p className="mb-4 text-sm text-muted-foreground">
          Installs missing catalogue entries and creates class–subject slots for every {levelShortLabel(level)} class in
          the selected year.
        </p>
        <Button
          type="button"
          disabled={!academicYearId || setupMutation.isPending}
          onClick={() => setConfirmSetup(true)}
        >
          {setupMutation.isPending ? "Provisioning…" : `Install & provision ${levelShortLabel(level)}`}
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmSetup}
        title={`Provision ${levelShortLabel(level)} curriculum?`}
        description={
          level === "O_LEVEL"
            ? "This will upsert default O-Level subjects, CBC strands, and assign all O-Level subjects to every class in the selected year."
            : "This will upsert default A-Level subjects and assign track-based subjects to classes that have a track set."
        }
        confirmLabel="Provision"
        loading={setupMutation.isPending}
        onConfirm={() => {
          setConfirmSetup(false);
          setupMutation.mutate();
        }}
        onCancel={() => setConfirmSetup(false)}
      />
    </div>
  );
}
