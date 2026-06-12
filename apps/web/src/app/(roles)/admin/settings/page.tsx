"use client";

import { useEffect, useMemo, useState } from "react";
import type { SchoolSettings, UpdateSchoolSettingsInput } from "@uganda-cbc-sms/shared";
import { Camera } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSchoolSettings, useSchoolSettingsActions } from "@/hooks/useSchoolSettings";
import { apiUpload, getApiErrorMessage } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/media";

const EMPTY_FORM: UpdateSchoolSettingsInput = {
  schoolName: "",
  motto: null,
  vision: null,
  mission: null,
  logoUrl: null,
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,
  postalAddress: null,
  physicalAddress: null,
  primaryColor: "#1D4ED8",
  secondaryColor: "#0F172A",
  reportFooterText: null,
  reportLayout: {
    template: "modern",
    density: "comfortable",
    showStudentPhoto: true,
    showTableStripes: true,
    headerAlignment: "left",
    cornerRadius: 4,
    baseFontSize: 9,
  },
};

function mapToForm(settings: SchoolSettings): UpdateSchoolSettingsInput {
  return {
    schoolName: settings.schoolName ?? "",
    motto: settings.motto,
    vision: settings.vision,
    mission: settings.mission,
    logoUrl: settings.logoUrl,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    websiteUrl: settings.websiteUrl,
    postalAddress: settings.postalAddress,
    physicalAddress: settings.physicalAddress,
    primaryColor: settings.primaryColor ?? "#1D4ED8",
    secondaryColor: settings.secondaryColor ?? "#0F172A",
    reportFooterText: settings.reportFooterText,
    reportLayout: {
      template: settings.reportLayout?.template ?? "modern",
      density: settings.reportLayout?.density ?? "comfortable",
      showStudentPhoto: settings.reportLayout?.showStudentPhoto ?? true,
      showTableStripes: settings.reportLayout?.showTableStripes ?? true,
      headerAlignment: settings.reportLayout?.headerAlignment ?? "left",
      cornerRadius: settings.reportLayout?.cornerRadius ?? 4,
      baseFontSize: settings.reportLayout?.baseFontSize ?? 9,
    },
  };
}

function nullableText(value: string): string | null {
  const t = value.trim();
  return t.length ? t : null;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const INPUT_CLS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-ui focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AdminSchoolSettingsPage() {
  const settingsQ = useSchoolSettings();
  const saveMutation = useSchoolSettingsActions();
  const [form, setForm] = useState<UpdateSchoolSettingsInput>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => {
    if (settingsQ.data) {
      setForm(mapToForm(settingsQ.data));
      setHydrated(true);
    }
  }, [settingsQ.data]);

  const isDirty = useMemo(() => {
    if (!settingsQ.data) return false;
    return JSON.stringify(form) !== JSON.stringify(mapToForm(settingsQ.data));
  }, [form, settingsQ.data]);

  const hasPendingSchoolNameClear = useMemo(
    () => Boolean(settingsQ.data) && !(form.schoolName ?? "").trim() && Boolean(settingsQ.data?.schoolName?.trim()),
    [form.schoolName, settingsQ.data],
  );

  const onPickLogo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/svg+xml";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void onLogoUpload(file);
    };
    input.click();
  };

  const onLogoUpload = async (file: File) => {
    setOk(null);
    setErr(null);
    setLogoBusy(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const updated = await apiUpload<SchoolSettings>("/settings/logo", fd);
      setForm(mapToForm(updated));
      await settingsQ.refetch();
      setOk("School logo uploaded.");
    } catch (e) {
      setErr(getApiErrorMessage(e));
    } finally {
      setLogoBusy(false);
    }
  };

  const onSave = async () => {
    setOk(null);
    setErr(null);
    try {
      if (!settingsQ.data) return;
      const normalized: UpdateSchoolSettingsInput = {
        ...form,
        schoolName: (form.schoolName ?? "").trim() || null,
        motto: nullableText(form.motto ?? ""),
        vision: nullableText(form.vision ?? ""),
        mission: nullableText(form.mission ?? ""),
        logoUrl: nullableText(form.logoUrl ?? ""),
        contactEmail: nullableText(form.contactEmail ?? ""),
        contactPhone: nullableText(form.contactPhone ?? ""),
        websiteUrl: nullableText(form.websiteUrl ?? ""),
        postalAddress: nullableText(form.postalAddress ?? ""),
        physicalAddress: nullableText(form.physicalAddress ?? ""),
        reportFooterText: nullableText(form.reportFooterText ?? ""),
        primaryColor: (form.primaryColor ?? "#1D4ED8").trim().toUpperCase(),
        secondaryColor: (form.secondaryColor ?? "#0F172A").trim().toUpperCase(),
        reportLayout: {
          template: form.reportLayout?.template ?? "modern",
          density: form.reportLayout?.density ?? "comfortable",
          showStudentPhoto: form.reportLayout?.showStudentPhoto ?? true,
          showTableStripes: form.reportLayout?.showTableStripes ?? true,
          headerAlignment: form.reportLayout?.headerAlignment ?? "left",
          cornerRadius: Number(form.reportLayout?.cornerRadius ?? 4),
          baseFontSize: Number(form.reportLayout?.baseFontSize ?? 9),
        },
      };
      const previous = mapToForm(settingsQ.data) as Record<string, unknown>;
      const payload: Record<string, unknown> = {};
      const normalizedRecord = normalized as Record<string, unknown>;
      for (const key of Object.keys(normalizedRecord)) {
        if (normalizedRecord[key] !== previous[key]) {
          payload[key] = normalizedRecord[key];
        }
      }
      if (Object.keys(payload).length === 0) {
        setOk("No changes to save.");
        return;
      }
      const updated = await saveMutation.mutateAsync(payload as Partial<UpdateSchoolSettingsInput>);
      setForm(mapToForm(updated));
      setOk("School settings saved successfully.");
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  };

  const onReset = () => {
    setOk(null);
    setErr(null);
    if (settingsQ.data) {
      setForm(mapToForm(settingsQ.data));
    }
  };

  return (
    <PageWrapper
      title="School settings"
      description="Configure your institution profile and branding used across admin workflows and generated report documents."
    >
      {!hydrated && settingsQ.isLoading ? (
        <Card title="Loading saved settings">
          <p className="text-sm text-muted-foreground">Loading your previously saved school settings...</p>
        </Card>
      ) : null}
      {!hydrated && settingsQ.isError ? (
        <Alert tone="error">
          {settingsQ.error instanceof Error ? settingsQ.error.message : "Failed to load saved settings."}
        </Alert>
      ) : null}
      {!hydrated ? null : (
        <>
      <div className="space-y-4">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <Card title="Identity and message">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="School name" hint="Shown in report headers and administration pages.">
                <input
                  className={INPUT_CLS}
                  value={form.schoolName ?? ""}
                  maxLength={140}
                  placeholder="School name"
                  onChange={(e) => setForm((s) => ({ ...s, schoolName: e.target.value }))}
                />
              </Field>
              <Field label="Motto" hint="Short inspirational line.">
                <input
                  className={INPUT_CLS}
                  value={form.motto ?? ""}
                  maxLength={180}
                  onChange={(e) => setForm((s) => ({ ...s, motto: e.target.value }))}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Vision">
                <textarea
                  className={INPUT_CLS}
                  rows={3}
                  value={form.vision ?? ""}
                  maxLength={600}
                  onChange={(e) => setForm((s) => ({ ...s, vision: e.target.value }))}
                />
              </Field>
              <Field label="Mission">
                <textarea
                  className={INPUT_CLS}
                  rows={4}
                  value={form.mission ?? ""}
                  maxLength={1200}
                  onChange={(e) => setForm((s) => ({ ...s, mission: e.target.value }))}
                />
              </Field>
            </div>
          </Card>

          <Card title="Branding and contacts">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Logo URL" hint="Public image URL (PNG/JPG/SVG recommended).">
                <div className="space-y-2">
                  <input
                    className={INPUT_CLS}
                    value={form.logoUrl ?? ""}
                    maxLength={500}
                    placeholder="https://example.com/logo.png"
                    onChange={(e) => setForm((s) => ({ ...s, logoUrl: e.target.value }))}
                  />
                  <Button type="button" variant="secondary" loading={logoBusy} onClick={onPickLogo}>
                    <Camera className="mr-2 h-4 w-4" />
                    Upload logo file
                  </Button>
                </div>
              </Field>
              <Field label="Website URL">
                <input
                  className={INPUT_CLS}
                  value={form.websiteUrl ?? ""}
                  maxLength={500}
                  placeholder="https://example.ac.ug"
                  onChange={(e) => setForm((s) => ({ ...s, websiteUrl: e.target.value }))}
                />
              </Field>
              <Field label="Contact email">
                <input
                  className={INPUT_CLS}
                  value={form.contactEmail ?? ""}
                  maxLength={160}
                  placeholder="admin@school.ac.ug"
                  onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))}
                />
              </Field>
              <Field label="Contact phone">
                <input
                  className={INPUT_CLS}
                  value={form.contactPhone ?? ""}
                  maxLength={40}
                  placeholder="+256 ..."
                  onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Postal address">
                <textarea
                  className={INPUT_CLS}
                  rows={3}
                  value={form.postalAddress ?? ""}
                  maxLength={300}
                  onChange={(e) => setForm((s) => ({ ...s, postalAddress: e.target.value }))}
                />
              </Field>
              <Field label="Physical address">
                <textarea
                  className={INPUT_CLS}
                  rows={3}
                  value={form.physicalAddress ?? ""}
                  maxLength={300}
                  onChange={(e) => setForm((s) => ({ ...s, physicalAddress: e.target.value }))}
                />
              </Field>
            </div>
          </Card>

          <Card title="Report styling">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Primary color" hint="Hex format e.g. #1D4ED8">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-10 w-12 cursor-pointer rounded border border-border bg-background p-1"
                    value={form.primaryColor ?? "#1D4ED8"}
                    onChange={(e) => setForm((s) => ({ ...s, primaryColor: e.target.value.toUpperCase() }))}
                  />
                  <input
                    className={INPUT_CLS}
                    value={form.primaryColor ?? ""}
                    maxLength={7}
                    onChange={(e) => setForm((s) => ({ ...s, primaryColor: e.target.value }))}
                  />
                </div>
              </Field>
              <Field label="Secondary color" hint="Hex format e.g. #0F172A">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-10 w-12 cursor-pointer rounded border border-border bg-background p-1"
                    value={form.secondaryColor ?? "#0F172A"}
                    onChange={(e) => setForm((s) => ({ ...s, secondaryColor: e.target.value.toUpperCase() }))}
                  />
                  <input
                    className={INPUT_CLS}
                    value={form.secondaryColor ?? ""}
                    maxLength={7}
                    onChange={(e) => setForm((s) => ({ ...s, secondaryColor: e.target.value }))}
                  />
                </div>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Report footer text">
                <textarea
                  className={INPUT_CLS}
                  rows={3}
                  value={form.reportFooterText ?? ""}
                  maxLength={280}
                  onChange={(e) => setForm((s) => ({ ...s, reportFooterText: e.target.value }))}
                />
              </Field>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Layout template">
                <select
                  className={INPUT_CLS}
                  value={form.reportLayout?.template ?? "modern"}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      reportLayout: { ...(s.reportLayout ?? {}), template: e.target.value as "classic" | "modern" },
                    }))
                  }
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                </select>
              </Field>
              <Field label="Content density">
                <select
                  className={INPUT_CLS}
                  value={form.reportLayout?.density ?? "comfortable"}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      reportLayout: {
                        ...(s.reportLayout ?? {}),
                        density: e.target.value as "compact" | "comfortable",
                      },
                    }))
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </Field>
              <Field label="Header alignment">
                <select
                  className={INPUT_CLS}
                  value={form.reportLayout?.headerAlignment ?? "left"}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      reportLayout: {
                        ...(s.reportLayout ?? {}),
                        headerAlignment: e.target.value as "left" | "center",
                      },
                    }))
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                </select>
              </Field>
              <Field label="Base font size">
                <input
                  type="number"
                  className={INPUT_CLS}
                  min={8}
                  max={12}
                  value={form.reportLayout?.baseFontSize ?? 9}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      reportLayout: { ...(s.reportLayout ?? {}), baseFontSize: Number(e.target.value) },
                    }))
                  }
                />
              </Field>
              <Field label="Corner radius">
                <input
                  type="number"
                  className={INPUT_CLS}
                  min={0}
                  max={12}
                  value={form.reportLayout?.cornerRadius ?? 4}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      reportLayout: { ...(s.reportLayout ?? {}), cornerRadius: Number(e.target.value) },
                    }))
                  }
                />
              </Field>
              <div className="grid gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.reportLayout?.showStudentPhoto ?? true}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        reportLayout: { ...(s.reportLayout ?? {}), showStudentPhoto: e.target.checked },
                      }))
                    }
                  />
                  Show student photo
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.reportLayout?.showTableStripes ?? true}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        reportLayout: { ...(s.reportLayout ?? {}), showTableStripes: e.target.checked },
                      }))
                    }
                  />
                  Zebra table rows
                </label>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Live preview">
            <div
              className="border p-4"
              style={{
                borderRadius: `${form.reportLayout?.cornerRadius ?? 4}px`,
                borderColor: form.primaryColor ?? "#1D4ED8",
                backgroundColor: "#F8FAFC",
                fontSize: `${form.reportLayout?.baseFontSize ?? 9}px`,
              }}
            >
              <div
                className="rounded-lg p-3 text-white"
                style={{
                  backgroundColor: form.primaryColor ?? "#1D4ED8",
                  textAlign: form.reportLayout?.headerAlignment ?? "left",
                }}
              >
                <div className="flex items-center gap-3">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveUploadUrl(form.logoUrl) ?? form.logoUrl}
                    alt="School logo preview"
                    className="h-12 w-12 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    Logo
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{form.schoolName || "School name"}</p>
                  <p className="text-sm text-slate-100">{form.motto || "School motto"}</p>
                </div>
              </div>
              </div>
              <div className="mt-3 rounded-lg border border-border bg-white p-3">
                <p className="text-xs text-muted-foreground">Student: Jane Doe | Class: S.4 Blue</p>
                {form.reportLayout?.showStudentPhoto ? (
                  <div className="mt-2 h-8 w-8 rounded border border-border bg-muted text-[10px] text-muted-foreground" />
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md border border-border bg-background p-2">
                  <p className="text-muted-foreground">Primary</p>
                  <p className="font-mono text-foreground">{form.primaryColor || "#1D4ED8"}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-2">
                  <p className="text-muted-foreground">Secondary</p>
                  <p className="font-mono text-foreground">{form.secondaryColor || "#0F172A"}</p>
                </div>
              </div>
              <div className="mt-3 rounded-md border border-border bg-white">
                <div className="grid grid-cols-3 border-b border-border px-2 py-1 text-[11px] font-semibold">
                  <span>Subject</span>
                  <span className="text-center">Grade</span>
                  <span className="text-right">Points</span>
                </div>
                {["Math", "English", "Biology"].map((s, idx) => (
                  <div
                    key={s}
                    className="grid grid-cols-3 px-2 py-1 text-[11px]"
                    style={{
                      background:
                        form.reportLayout?.showTableStripes !== false && idx % 2 === 1 ? "rgba(15,23,42,0.04)" : "white",
                    }}
                  >
                    <span>{s}</span>
                    <span className="text-center">A</span>
                    <span className="text-right">6</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {form.reportFooterText || "Footer text for generated reports appears here."}
              </p>
            </div>
          </Card>

          <Card title="Actions">
            <div className="space-y-3">
              <Button
                className="w-full"
                loading={saveMutation.isPending}
                disabled={settingsQ.isLoading || !isDirty || hasPendingSchoolNameClear}
                onClick={() => void onSave()}
              >
                Save settings
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                disabled={settingsQ.isLoading || saveMutation.isPending || !isDirty}
                onClick={onReset}
              >
                Reset unsaved changes
              </Button>
              <p className="text-xs text-muted-foreground">
                Last updated: {settingsQ.data?.updatedAt ? new Date(settingsQ.data.updatedAt).toLocaleString() : "—"}
              </p>
              {hasPendingSchoolNameClear ? (
                <p className="text-xs text-red-600">School name cannot be cleared. Keep an existing or new value.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
        </>
      )}
    </PageWrapper>
  );
}
