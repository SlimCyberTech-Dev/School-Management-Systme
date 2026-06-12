"use client";

import type { ReactNode } from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
  size = "default",
  busy = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: "default" | "wide";
  /** When true, blocks dismiss and shows a saving hint (use with submit loading). */
  busy?: boolean;
}) {
  if (!open) return null;
  const widthClass = size === "wide" ? "max-w-3xl" : "max-w-lg";
  const requestClose = () => {
    if (!busy) onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`max-h-[90vh] w-full ${widthClass} overflow-auto rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xl`}
        role="dialog"
        aria-modal="true"
        aria-busy={busy}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            onClick={requestClose}
            disabled={busy}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {busy ? (
          <p className="mb-3 text-sm text-muted-foreground">Saving your changes…</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
