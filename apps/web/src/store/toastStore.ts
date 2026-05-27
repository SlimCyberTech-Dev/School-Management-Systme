import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export type MessageToast = {
  id: string;
  kind: "message";
  tone: ToastTone;
  title?: string;
  message: string;
  durationMs: number;
};

export type ConfirmToast = {
  id: string;
  kind: "confirm";
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  loading: boolean;
  onConfirm: () => void | Promise<void>;
};

export type Toast = MessageToast | ConfirmToast;

export type PushToastInput =
  | {
      kind: "message";
      tone: ToastTone;
      title?: string;
      message: string;
      durationMs: number;
    }
  | {
      kind: "confirm";
      title: string;
      description: string;
      confirmLabel: string;
      cancelLabel: string;
      loading?: boolean;
      onConfirm: () => void | Promise<void>;
    };

type ToastState = {
  toasts: Toast[];
  push: (toast: PushToastInput) => string;
  dismiss: (id: string) => void;
  setConfirmLoading: (id: string, loading: boolean) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => {
      const withoutConfirms =
        toast.kind === "confirm" ? state.toasts.filter((t) => t.kind !== "confirm") : state.toasts;
      const next: Toast =
        toast.kind === "confirm"
          ? {
              id,
              kind: "confirm",
              title: toast.title,
              description: toast.description,
              confirmLabel: toast.confirmLabel,
              cancelLabel: toast.cancelLabel,
              loading: toast.loading ?? false,
              onConfirm: toast.onConfirm,
            }
          : {
              id,
              kind: "message",
              tone: toast.tone,
              title: toast.title,
              message: toast.message,
              durationMs: toast.durationMs,
            };
      return { toasts: [...withoutConfirms, next] };
    });
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setConfirmLoading: (id, loading) =>
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id && t.kind === "confirm" ? { ...t, loading } : t,
      ),
    })),
}));
