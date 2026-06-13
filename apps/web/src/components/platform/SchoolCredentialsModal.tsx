"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { TenantCredentials } from "@uganda-cbc-sms/shared";
import { PlatformModal } from "./PlatformModal";
import { platformBtnPrimary, platformBtnSecondary } from "./platformFieldStyles";

function copyText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

function credentialsBlock(c: TenantCredentials): string {
  return [
    `${c.schoolName} — SchoolManage access`,
    "",
    `Sign in: ${c.signInUrl}`,
    `Email: ${c.adminEmail}`,
    `Temporary password: ${c.temporaryPassword}`,
    "",
    "The admin must change this password on first sign-in.",
  ].join("\n");
}

function whatsAppBlock(c: TenantCredentials): string {
  return [
    `Hello! Your school "${c.schoolName}" is ready on SchoolManage.`,
    `Sign in: ${c.signInUrl}`,
    `Email: ${c.adminEmail}`,
    `Password: ${c.temporaryPassword}`,
    "You'll set a new password when you first log in.",
  ].join("\n");
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await copyText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 flex items-start justify-between gap-2">
        <p className="break-all font-mono text-sm text-slate-900 dark:text-slate-100">{value}</p>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function SchoolCredentialsModal({
  open,
  credentials,
  onClose,
}: {
  open: boolean;
  credentials: TenantCredentials | null;
  onClose: () => void;
}) {
  const [copiedAll, setCopiedAll] = useState(false);

  if (!credentials) return null;

  async function copyAll(mode: "plain" | "whatsapp") {
    await copyText(mode === "whatsapp" ? whatsAppBlock(credentials!) : credentialsBlock(credentials!));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <PlatformModal
      open={open}
      onClose={onClose}
      title="School provisioned"
      description="Copy these credentials and share them securely with the school administrator. The password is shown only once."
      footer={
        <>
          <button type="button" className={platformBtnSecondary} onClick={onClose}>
            Done
          </button>
          <button type="button" className={platformBtnPrimary} onClick={() => void copyAll("plain")}>
            {copiedAll ? "Copied!" : "Copy all"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <CopyRow label="Sign-in URL" value={credentials.signInUrl} />
        <CopyRow label="Admin email" value={credentials.adminEmail} />
        <CopyRow label="Temporary password" value={credentials.temporaryPassword} />
        <button
          type="button"
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          onClick={() => void copyAll("whatsapp")}
        >
          Copy as WhatsApp message
        </button>
      </div>
    </PlatformModal>
  );
}
