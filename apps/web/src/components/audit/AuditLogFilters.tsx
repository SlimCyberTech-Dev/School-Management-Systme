"use client";

import {
  AUDIT_CATEGORIES,
  AUDIT_OUTCOMES,
  AUDIT_SEVERITIES,
  type AuditLogsQuery,
} from "@uganda-cbc-sms/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CATEGORY_LABELS } from "./auditLabels";

type Props = {
  filters: AuditLogsQuery;
  onChange: (next: Partial<AuditLogsQuery>) => void;
  onApply: () => void;
  onReset: () => void;
};

export function AuditLogFilters({ filters, onChange, onApply, onReset }: Props) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Select
          label="Category"
          options={[
            { value: "", label: "All categories" },
            ...AUDIT_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
          ]}
          value={filters.category ?? ""}
          onChange={(e) => onChange({ category: e.target.value ? (e.target.value as AuditLogsQuery["category"]) : undefined, page: 1 })}
        />
        <Select
          label="Severity"
          options={[
            { value: "", label: "All severities" },
            ...AUDIT_SEVERITIES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
          ]}
          value={filters.severity ?? ""}
          onChange={(e) => onChange({ severity: e.target.value ? (e.target.value as AuditLogsQuery["severity"]) : undefined, page: 1 })}
        />
        <Select
          label="Outcome"
          options={[
            { value: "", label: "All outcomes" },
            ...AUDIT_OUTCOMES.map((o) => ({ value: o, label: o.charAt(0).toUpperCase() + o.slice(1) })),
          ]}
          value={filters.outcome ?? ""}
          onChange={(e) => onChange({ outcome: e.target.value ? (e.target.value as AuditLogsQuery["outcome"]) : undefined, page: 1 })}
        />
        <Input
          label="From"
          type="date"
          value={filters.from?.slice(0, 10) ?? ""}
          onChange={(e) => onChange({ from: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined, page: 1 })}
        />
        <Input
          label="To"
          type="date"
          value={filters.to?.slice(0, 10) ?? ""}
          onChange={(e) => onChange({ to: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined, page: 1 })}
        />
        <div className="sm:col-span-2 lg:col-span-4 xl:col-span-6">
          <Input
            label="Search"
            placeholder="Message, action, IP, actor name…"
            value={filters.search ?? ""}
            onChange={(e) => onChange({ search: e.target.value || undefined })}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={onApply}>
          Apply filters
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
