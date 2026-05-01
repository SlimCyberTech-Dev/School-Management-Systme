import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className = "", id, ...rest }: Props) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-ui placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${
          error ? "border-red-500" : ""
        } ${className}`}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
