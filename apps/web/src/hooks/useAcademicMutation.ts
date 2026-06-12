import { useCallback, useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

export type AcademicToast = {
  title: string;
  message: string;
};

export function useAcademicMutation() {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const runCreate = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      success: AcademicToast,
      errorTitle = "Could not create",
    ): Promise<T | undefined> => {
      setCreating(true);
      try {
        const result = await fn();
        toast.success(success.message, success.title);
        return result;
      } catch (e) {
        toast.error(getApiErrorMessage(e), errorTitle);
        return undefined;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  const runSave = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      success: AcademicToast,
      errorTitle = "Could not save",
    ): Promise<T | undefined> => {
      setSaving(true);
      try {
        const result = await fn();
        toast.success(success.message, success.title);
        return result;
      } catch (e) {
        toast.error(getApiErrorMessage(e), errorTitle);
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const runDelete = useCallback(
    async (
      fn: () => Promise<void>,
      success: AcademicToast,
      errorTitle = "Could not delete",
    ): Promise<boolean> => {
      setDeleting(true);
      try {
        await fn();
        toast.success(success.message, success.title);
        return true;
      } catch (e) {
        toast.error(getApiErrorMessage(e), errorTitle);
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [],
  );

  return { creating, saving, deleting, runCreate, runSave, runDelete };
}
