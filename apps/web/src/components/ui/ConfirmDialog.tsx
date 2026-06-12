"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" disabled={loading} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          loading={loading}
          className={danger ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600" : ""}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
