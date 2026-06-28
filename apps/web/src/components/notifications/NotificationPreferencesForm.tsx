"use client";

import { useMemo } from "react";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { Card } from "@/components/ui/Card";
import { queryStatus } from "@/lib/queryStatus";
import type { NotificationPreference } from "@/lib/notifications";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotifications";

function PreferenceRow({
  pref,
  disabled,
  onToggle,
}: {
  pref: NotificationPreference;
  disabled: boolean;
  onToggle: (field: "emailEnabled" | "inAppEnabled", value: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{pref.label}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={pref.inAppEnabled}
            disabled={disabled}
            onChange={(e) => onToggle("inAppEnabled", e.target.checked)}
          />
          In-app notifications
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={pref.emailEnabled}
            disabled={disabled}
            onChange={(e) => onToggle("emailEnabled", e.target.checked)}
          />
          Email notifications
        </label>
      </div>
    </div>
  );
}

export function NotificationPreferencesForm() {
  const prefsQ = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const status = queryStatus(prefsQ, (data) => data.length === 0);

  const saving = updatePrefs.isPending;

  const onToggle = (category: string, field: "emailEnabled" | "inAppEnabled", value: boolean) => {
    void updatePrefs.mutateAsync([{ category, [field]: value }]);
  };

  const sorted = useMemo(
    () => [...(prefsQ.data ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
    [prefsQ.data],
  );

  return (
    <AsyncContent
      status={status}
      loading={<FormSkeleton fields={3} />}
      error={
        <ErrorState
          message={prefsQ.error instanceof Error ? prefsQ.error.message : "Failed to load preferences"}
          onRetry={() => void prefsQ.refetch()}
        />
      }
    >
      <Card title="Notification preferences">
        <p className="mb-4 text-sm text-muted-foreground">
          Choose how you want to be notified for each category.
        </p>
        <div className="space-y-3">
          {sorted.map((pref) => (
            <PreferenceRow
              key={pref.category}
              pref={pref}
              disabled={saving}
              onToggle={(field, value) => onToggle(pref.category, field, value)}
            />
          ))}
        </div>
        {saving ? <p className="mt-3 text-xs text-muted-foreground">Saving…</p> : null}
      </Card>
    </AsyncContent>
  );
}
