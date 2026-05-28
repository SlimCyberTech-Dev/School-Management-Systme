"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { BulkInvoicePreview } from "@uganda-cbc-sms/shared";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Table, type Column } from "@/components/ui/Table";
import { useFeeActions, useFeeScheduleSummary } from "@/hooks/useFees";
import { getApiErrorMessage } from "@/lib/api";
import { feeScheduleStatusLabel, feeScheduleStatusTone } from "@/lib/feeSchedule";
import { formatUgx } from "@/lib/formatMoney";
import { toast } from "@/lib/toast";

export function FeeScheduleBillingPanel({
  classId,
  termId,
  classLabel,
  termLabel,
  onClose,
  onUpdated,
}: {
  classId: string;
  termId: string;
  classLabel?: string;
  termLabel?: string;
  onClose?: () => void;
  onUpdated?: () => void;
}) {
  const router = useRouter();
  const actions = useFeeActions();
  const summaryQ = useFeeScheduleSummary(classId, termId);
  const [preview, setPreview] = useState<BulkInvoicePreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const summary = summaryQ.data;
  const hasCategories = (summary?.categoryCount ?? 0) > 0;
  const status = summary?.status ?? "draft";

  const contextLabel = useMemo(() => {
    if (classLabel && termLabel) return `${classLabel} · ${termLabel}`;
    if (summary?.className) {
      const name = summary.classStream
        ? `${summary.className} · ${summary.classStream}`
        : summary.className;
      return `${name} · ${summary.termLabel ?? "Term"}`;
    }
    return "Selected class";
  }, [classLabel, termLabel, summary]);

  const refresh = async () => {
    await summaryQ.refetch();
    onUpdated?.();
  };

  const runPublish = () => {
    toast.confirm({
      title: "Publish fee schedule?",
      description: `Bursars will be able to bill students in ${contextLabel} at ${formatUgx(summary?.totalPerStudent ?? 0)} UGX each.`,
      confirmLabel: "Publish now",
      onConfirm: async () => {
        try {
          await actions.publishSchedule.mutateAsync({ classId, termId });
          toast.success("Published. Bursars can bill this class.", "Done");
          await refresh();
        } catch (e) {
          toast.error(getApiErrorMessage(e), "Could not publish");
        }
      },
    });
  };

  const runUnpublish = () => {
    toast.confirm({
      title: "Return to draft?",
      description: `Allow editing fee categories for ${contextLabel} again?`,
      confirmLabel: "Unpublish",
      onConfirm: async () => {
        try {
          await actions.unpublishSchedule.mutateAsync({ classId, termId });
          toast.success("Back to draft. You can edit categories.", "Unpublished");
          await refresh();
        } catch (e) {
          toast.error(getApiErrorMessage(e), "Could not unpublish");
        }
      },
    });
  };

  const runPreview = async () => {
    try {
      const data = await actions.previewBulkInvoices.mutateAsync({ classId, termId });
      setPreview(data);
      setPreviewOpen(true);
    } catch (e) {
      toast.error(getApiErrorMessage(e), "Could not load preview");
    }
  };

  const runBill = () => {
    if (!summary || summary.categoryCount === 0) return;
    toast.confirm({
      title: "Bill entire class?",
      description: `Create invoices for active students in ${contextLabel} at ${formatUgx(summary.totalPerStudent)} UGX each?`,
      confirmLabel: "Generate invoices",
      onConfirm: async () => {
        try {
          const result = await actions.bulkInvoices.mutateAsync({ classId, termId });
          toast.success(
            result.created === 0
              ? `No new invoices (${result.skipped} already billed).`
              : `Created ${result.created} invoice${result.created === 1 ? "" : "s"}.`,
            "Billing complete",
          );
          await actions.invalidateFinance();
          await refresh();
        } catch (e) {
          toast.error(getApiErrorMessage(e), "Could not bill");
        }
      },
    });
  };

  const previewColumns: Column<BulkInvoicePreview["students"][number]>[] = [
    { key: "studentNumber", header: "No.", render: (r) => r.studentNumber },
    { key: "studentName", header: "Student", render: (r) => r.studentName },
    {
      key: "hasInvoice",
      header: "Invoice",
      render: (r) => (r.hasInvoice ? "Already billed" : "Will create"),
    },
  ];

  let nextStepTitle = "";
  let nextStepDetail = "";
  let primaryAction: React.ReactNode = null;

  const structureHref = `/admin/fees/structure?termId=${encodeURIComponent(termId)}&classId=${encodeURIComponent(classId)}`;

  if (!hasCategories) {
    nextStepTitle = "Step 1: Set fee amounts";
    nextStepDetail = "Add fee categories for this class before you can publish.";
    primaryAction = (
      <Button onClick={() => router.push(structureHref)}>Set up fee structure</Button>
    );
  } else if (status === "draft") {
    nextStepTitle = "Step 2: Publish for bursars";
    nextStepDetail =
      "Publishing locks the amounts and tells the bursar this class is ready to bill. You can unpublish only before any invoices exist.";
    primaryAction = (
      <Button loading={actions.publishSchedule.isPending} onClick={runPublish}>
        Publish for bursars
      </Button>
    );
  } else if (status === "published") {
    nextStepTitle = "Step 3: Bill students (optional)";
    nextStepDetail =
      "The bursar can bill from their portal, or you can generate class invoices here now.";
    primaryAction = (
      <div className="flex flex-wrap gap-2">
        <Button loading={actions.bulkInvoices.isPending} onClick={runBill}>
          Bill class now
        </Button>
        <Button variant="secondary" loading={actions.previewBulkInvoices.isPending} onClick={() => void runPreview()}>
          Preview who will be billed
        </Button>
      </div>
    );
  } else {
    nextStepTitle = "Invoices created";
    nextStepDetail = "This class has been billed. Bill any new students who joined after the first run.";
    primaryAction = (
      <div className="flex flex-wrap gap-2">
        <Button loading={actions.bulkInvoices.isPending} onClick={runBill}>
          Bill remaining students
        </Button>
        <Button variant="secondary" loading={actions.previewBulkInvoices.isPending} onClick={() => void runPreview()}>
          Preview
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card title={contextLabel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Badge tone={hasCategories ? feeScheduleStatusTone(status) : "neutral"}>
            {hasCategories ? feeScheduleStatusLabel(status) : "No fees"}
          </Badge>
          {onClose ? (
            <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={onClose}>
              Close
            </Button>
          ) : null}
        </div>

        {summaryQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {hasCategories ? (
              <p className="mb-4 text-sm text-muted-foreground">
                {summary!.categoryCount} categor{summary!.categoryCount === 1 ? "y" : "ies"} ·{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatUgx(summary!.totalPerStudent)} UGX
                </span>{" "}
                per student · {summary!.activeStudentCount} active · {summary!.invoicedStudentCount} invoiced
              </p>
            ) : null}

            <div className="rounded-lg border-2 border-brand/30 bg-brand/5 p-4">
              <p className="font-semibold text-foreground">{nextStepTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{nextStepDetail}</p>
              <div className="mt-4">{primaryAction}</div>
            </div>

            {status === "published" ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button variant="secondary" loading={actions.unpublishSchedule.isPending} onClick={runUnpublish}>
                  Unpublish (edit fees)
                </Button>
                <button
                  type="button"
                  className="text-sm font-medium text-brand hover:underline"
                  onClick={() => router.push(structureHref)}
                >
                  Edit fee categories
                </button>
              </div>
            ) : null}

            {status === "draft" && hasCategories ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Need to change amounts? Edit categories below, then publish when ready.
              </p>
            ) : null}
          </>
        )}
      </Card>

      <Modal open={previewOpen} title="Billing preview" onClose={() => setPreviewOpen(false)}>
        {preview ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {preview.wouldCreate} new · {preview.wouldSkip} skipped · {formatUgx(preview.totalPerStudent)} UGX
              each
            </p>
            <Table
              columns={previewColumns as unknown as Column<Record<string, unknown>>[]}
              rows={preview.students as unknown as Record<string, unknown>[]}
              emptyState={<p className="text-sm text-muted-foreground">No active students.</p>}
            />
            <div className="flex gap-2">
              {preview.scheduleStatus !== "draft" && preview.wouldCreate > 0 ? (
                <Button
                  loading={actions.bulkInvoices.isPending}
                  onClick={() => {
                    setPreviewOpen(false);
                    runBill();
                  }}
                >
                  Bill {preview.wouldCreate} student{preview.wouldCreate === 1 ? "" : "s"}
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
