import { useToastStore } from "@/store/toastStore";

const DEFAULT_SUCCESS_MS = 4500;
const DEFAULT_ERROR_MS = 6000;

function pushMessage(
  tone: "success" | "error" | "info",
  message: string,
  title?: string,
  durationMs?: number,
) {
  const duration =
    durationMs ?? (tone === "error" ? DEFAULT_ERROR_MS : tone === "info" ? 5000 : DEFAULT_SUCCESS_MS);
  return useToastStore.getState().push({
    kind: "message",
    tone,
    title,
    message,
    durationMs: duration,
  });
}

export const toast = {
  success(message: string, title?: string) {
    return pushMessage("success", message, title);
  },
  error(message: string, title?: string) {
    return pushMessage("error", message, title);
  },
  info(message: string, title?: string) {
    return pushMessage("info", message, title);
  },
  confirm(options: {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
  }) {
    return useToastStore.getState().push({
      kind: "confirm",
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel ?? "Confirm",
      cancelLabel: options.cancelLabel ?? "Cancel",
      onConfirm: options.onConfirm,
    });
  },
  dismiss(id: string) {
    useToastStore.getState().dismiss(id);
  },
};
