"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { newPassword: string; forcePasswordChange: boolean }) => Promise<void>;
};

export function ResetPasswordModal({ open, onClose, onSubmit }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ newPassword, forcePasswordChange });
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Reset password" onClose={onClose}>
      <div className="space-y-3">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Input label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={forcePasswordChange}
            onChange={(e) => setForcePasswordChange(e.target.checked)}
          />
          Force user to change password on next login
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={() => void submit()}>Reset password</Button>
        </div>
      </div>
    </Modal>
  );
}
