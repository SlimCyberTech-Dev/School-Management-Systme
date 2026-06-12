"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, Lock, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToastStore, type MessageToast, type Toast } from "@/store/toastStore";

function MessageToastCard({ toast, onDismiss }: { toast: MessageToast; onDismiss: () => void }) {
  const Icon =
    toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;
  const accent =
    toast.tone === "success"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/80"
      : toast.tone === "error"
        ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/80"
        : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/80";
  const iconColor =
    toast.tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : toast.tone === "error"
        ? "text-red-600 dark:text-red-400"
        : "text-blue-600 dark:text-blue-400";

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [toast.durationMs, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`pointer-events-auto flex w-full max-w-sm gap-3 rounded-xl border p-4 shadow-lg ${accent}`}
      role="status"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {toast.title ? <p className="text-sm font-semibold text-foreground">{toast.title}</p> : null}
        <p className={`text-sm text-foreground/90 ${toast.title ? "mt-0.5" : ""}`}>{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function ConfirmToastCard({
  toast,
  onDismiss,
  onConfirmLoading,
}: {
  toast: Extract<Toast, { kind: "confirm" }>;
  onDismiss: () => void;
  onConfirmLoading: (loading: boolean) => void;
}) {
  const handleConfirm = async () => {
    onConfirmLoading(true);
    try {
      await toast.onConfirm();
      onDismiss();
    } catch {
      onConfirmLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="pointer-events-auto w-full max-w-sm rounded-xl border border-amber-200 bg-card p-4 shadow-xl dark:border-amber-900/60"
      role="alertdialog"
      aria-labelledby={`toast-title-${toast.id}`}
      aria-describedby={`toast-desc-${toast.id}`}
    >
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <Lock className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p id={`toast-title-${toast.id}`} className="text-sm font-semibold text-foreground">
            {toast.title}
          </p>
          <p id={`toast-desc-${toast.id}`} className="mt-1 text-sm text-muted-foreground">
            {toast.description}
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-3"
              disabled={toast.loading}
              onClick={onDismiss}
            >
              {toast.cancelLabel}
            </Button>
            <Button
              type="button"
              loading={toast.loading}
              className="h-8 bg-amber-700 px-3 hover:bg-amber-800 focus-visible:ring-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
              onClick={() => void handleConfirm()}
            >
              {toast.confirmLabel}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          disabled={toast.loading}
          className="shrink-0 self-start rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const setConfirmLoading = useToastStore((s) => s.setConfirmLoading);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 p-0 sm:bottom-6 sm:right-6"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) =>
          t.kind === "confirm" ? (
            <ConfirmToastCard
              key={t.id}
              toast={t}
              onDismiss={() => dismiss(t.id)}
              onConfirmLoading={(loading) => setConfirmLoading(t.id, loading)}
            />
          ) : (
            <MessageToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ),
        )}
      </AnimatePresence>
    </div>
  );
}
