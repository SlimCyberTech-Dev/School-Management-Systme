"use client";

import { useEffect, useState } from "react";
import type { ExamDeletionImpact } from "@uganda-cbc-sms/shared";
import { examPermanentDeleteDialogCopy } from "@/lib/examDeleteCopy";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function PermanentDeleteExamDialog({
  open,
  impact,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  impact: ExamDeletionImpact | null;
  loading?: boolean;
  onConfirm: (confirmName: string) => void;
  onCancel: () => void;
}) {
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (open) setConfirmName("");
  }, [open, impact?.examName]);

  if (!impact) return null;

  const copy = examPermanentDeleteDialogCopy(impact);
  const nameMatches = confirmName.trim() === impact.examName.trim();

  return (
    <Modal open={open} title={copy.title} onClose={onCancel}>
      <p className="mb-3 text-sm text-muted-foreground">{copy.description}</p>
      {!impact.canPermanentDelete && impact.blockReason ? (
        <div className="mb-3">
          <Alert tone="error">{impact.blockReason}</Alert>
        </div>
      ) : null}
      {impact.canPermanentDelete ? (
        <Input
          label="Exam name"
          placeholder={copy.confirmHint}
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          autoComplete="off"
        />
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" disabled={loading} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          loading={loading}
          disabled={!impact.canPermanentDelete || !nameMatches}
          className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
          onClick={() => onConfirm(confirmName.trim())}
        >
          Delete permanently
        </Button>
      </div>
    </Modal>
  );
}
