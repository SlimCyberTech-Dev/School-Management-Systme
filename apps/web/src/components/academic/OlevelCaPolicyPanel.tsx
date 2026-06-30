"use client";

import { DEFAULT_ASSESSMENT_CONFIG, type AssessmentConfig } from "@uganda-cbc-sms/shared";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiGet, apiPut, getApiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

export function OlevelCaPolicyPanel() {
  const [config, setConfig] = useState<AssessmentConfig>(DEFAULT_ASSESSMENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await apiGet<AssessmentConfig>("/settings/assessment-config");
        setConfig(data);
      } catch (e) {
        toast.error(getApiErrorMessage(e), "Could not load term grade policy");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await apiPut<AssessmentConfig>("/settings/assessment-config", config);
      setConfig(saved);
      toast.success("Project work settings saved.", "Saved");
    } catch (e) {
      toast.error(getApiErrorMessage(e), "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading term grade policy…</p>;

  return (
    <Card title="Term grade policy">
      <Alert tone="info">
        Compulsory <strong>exam averages</strong> drive term grades. Optional <strong>project work</strong> blends in
        when enabled. Weights are also editable under Assessment → Term grade policy.
      </Alert>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Project work weight</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={config.caWeight}
            onChange={(e) => setConfig((c) => ({ ...c, caWeight: Number(e.target.value) }))}
            className="w-full rounded border border-border bg-background px-2 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Exam average weight</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={config.eocWeight}
            onChange={(e) => setConfig((c) => ({ ...c, eocWeight: Number(e.target.value) }))}
            className="w-full rounded border border-border bg-background px-2 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Expected projects per term</span>
          <input
            type="number"
            min={1}
            max={20}
            value={config.projectWork.expectedPerTerm}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                projectWork: { ...c.projectWork, expectedPerTerm: Number(e.target.value) },
              }))
            }
            className="w-full rounded border border-border bg-background px-2 py-2"
          />
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={config.includeProjectWorkInTermGrade}
          onChange={(e) =>
            setConfig((c) => ({ ...c, includeProjectWorkInTermGrade: e.target.checked }))
          }
        />
        Include project work in term final grade
      </label>

      <Button className="mt-4" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save policy"}
      </Button>
    </Card>
  );
}
