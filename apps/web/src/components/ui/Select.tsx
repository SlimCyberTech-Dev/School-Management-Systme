import type { SelectHTMLAttributes } from "react";

type Option = { value: string; label: string };

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Option[];
};

export function Select({ label, error, options, className = "", id, ...rest }: Props) {
  const selectId = id ?? rest.name;
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${
          error ? "border-red-500" : ""
        } ${className}`}
        {...rest}
      >
        {options.map((o, idx) => (
          <option key={`${idx}-${o.label}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
