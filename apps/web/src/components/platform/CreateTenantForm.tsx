"use client";

import { platformInputClass, platformLabelClass } from "./platformFieldStyles";

export const CREATE_TENANT_FORM_ID = "platform-create-tenant-form";

export type CreateTenantFormState = {
  slug: string;
  displayName: string;
  adminEmail: string;
  adminFullName: string;
};

export function CreateTenantForm({
  form,
  onChange,
  onSubmit,
}: {
  form: CreateTenantFormState;
  onChange: (next: CreateTenantFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form id={CREATE_TENANT_FORM_ID} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className={platformLabelClass}>
        Subdomain slug
        <input
          required
          pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
          placeholder="e.g. greenhill"
          className={platformInputClass}
          value={form.slug}
          onChange={(e) => onChange({ ...form, slug: e.target.value.toLowerCase() })}
        />
        <span className="mt-1 block text-xs text-slate-500">
          Staff sign-in: {form.slug || "slug"}.localhost:3000
        </span>
      </label>
      <label className={platformLabelClass}>
        School name
        <input
          required
          placeholder="Greenhill Secondary School"
          className={platformInputClass}
          value={form.displayName}
          onChange={(e) => onChange({ ...form, displayName: e.target.value })}
        />
      </label>
      <label className={platformLabelClass}>
        Admin email
        <input
          type="email"
          required
          autoComplete="off"
          className={platformInputClass}
          value={form.adminEmail}
          onChange={(e) => onChange({ ...form, adminEmail: e.target.value })}
        />
      </label>
      <div className={`${platformLabelClass} flex flex-col justify-end`}>
        <p className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/80 px-3 py-2.5 text-xs text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
          A secure temporary password is generated automatically. The admin must change it on first
          sign-in.
        </p>
      </div>
      <label className={`${platformLabelClass} sm:col-span-2`}>
        Admin full name <span className="font-normal text-slate-500">(optional)</span>
        <input
          className={platformInputClass}
          value={form.adminFullName}
          onChange={(e) => onChange({ ...form, adminFullName: e.target.value })}
        />
      </label>
    </form>
  );
}
