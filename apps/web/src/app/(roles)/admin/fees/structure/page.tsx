"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FeeStructureCopyPanel } from "@/components/fees/admin/FeeStructureCopyPanel";
import { FeeStructureFilters, type FeeStructureFilterValues } from "@/components/fees/admin/FeeStructureFilters";
import { FeeStructureForm } from "@/components/fees/admin/FeeStructureForm";
import { FeeStructureTable } from "@/components/fees/admin/FeeStructureTable";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useClassEnrollmentSummary } from "@/hooks/useStudentsBrowse";
import { useFeeScheduleReleases, useFeeScheduleSummary, useFeeStructures } from "@/hooks/useFees";
import { isFeeStructureLocked } from "@/lib/feeSchedule";
import { queryStatus } from "@/lib/queryStatus";
import type { FeeScheduleStatus } from "@uganda-cbc-sms/shared";

export default function AdminFeesStructurePage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FeeStructureFilterValues>({
    yearId: searchParams.get("yearId") ?? "",
    termId: searchParams.get("termId") ?? "",
    classId: searchParams.get("classId") ?? "",
  });

  const apiFilters = useMemo(
    () => ({
      classId: filters.classId || undefined,
      termId: filters.termId || undefined,
    }),
    [filters.classId, filters.termId],
  );

  const structuresQ = useFeeStructures(apiFilters);
  const schedulesQ = useFeeScheduleReleases(
    filters.termId ? { termId: filters.termId, classId: filters.classId || undefined } : undefined,
  );
  const summaryQ = useFeeScheduleSummary(filters.classId || undefined, filters.termId || undefined);
  const enrollmentQ = useClassEnrollmentSummary();

  const status = queryStatus(structuresQ);

  const scheduleByKey = useMemo(() => {
    const m = new Map<string, FeeScheduleStatus>();
    for (const r of schedulesQ.data ?? []) {
      m.set(`${r.classId}:${r.termId}`, r.status);
    }
    for (const row of structuresQ.data ?? []) {
      const key = `${row.classId}:${row.termId}`;
      if (!m.has(key)) m.set(key, "draft");
    }
    return m;
  }, [schedulesQ.data, structuresQ.data]);

  const structureLocked = isFeeStructureLocked(summaryQ.data?.status);

  const publishHref = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.yearId) p.set("yearId", filters.yearId);
    if (filters.termId) p.set("termId", filters.termId);
    if (filters.classId) p.set("classId", filters.classId);
    const qs = p.toString();
    return `/admin/fees/publish${qs ? `?${qs}` : ""}`;
  }, [filters]);

  const refetchAll = () => {
    void structuresQ.refetch();
    void schedulesQ.refetch();
    if (filters.classId && filters.termId) void summaryQ.refetch();
  };

  return (
    <div className="space-y-6">
      <Alert tone="info">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            After setting fee amounts here, go to <strong>Publish & bill</strong> to release schedules to the
            bursar.
          </span>
          <Link href={publishHref}>
            <Button>Open publish & bill</Button>
          </Link>
        </div>
      </Alert>

      <Card title="Filters">
        <FeeStructureFilters values={filters} onChange={setFilters} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Add fee category">
          {structureLocked ? (
            <Alert tone="info">
              This schedule is published or billed.{" "}
              <Link className="font-medium text-brand underline" href={publishHref}>
                Manage on Publish & bill
              </Link>
            </Alert>
          ) : null}
          <FeeStructureForm
            defaultClassId={filters.classId}
            defaultTermId={filters.termId}
            disabled={structureLocked}
            onCreated={refetchAll}
          />
        </Card>
        <Card title="Copy structure to another class">
          <FeeStructureCopyPanel onCopied={refetchAll} />
        </Card>
      </div>

      <Card title="Fee structure by class">
        <AsyncContent
          status={status}
          loading={<FormSkeleton fields={5} />}
          error={
            <ErrorState
              message={
                structuresQ.error instanceof Error
                  ? structuresQ.error.message
                  : "Could not load fee structure."
              }
              onRetry={refetchAll}
            />
          }
        >
          <FeeStructureTable
            rows={structuresQ.data ?? []}
            enrollment={enrollmentQ.data ?? []}
            scheduleByKey={scheduleByKey}
            yearId={filters.yearId}
            onPublished={refetchAll}
          />
        </AsyncContent>
      </Card>
    </div>
  );
}
