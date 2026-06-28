import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type FormInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  type?: string;
  placeholder?: string;
  error?: string;
  rightSlot?: ReactNode;
};

function cx(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function FormInput({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  placeholder,
  error,
  rightSlot,
}: FormInputProps) {
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="font-body mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cx(
            "font-body w-full rounded-lg border border-border bg-background px-11 py-2.5 text-sm text-foreground shadow-sm outline-none transition-ui placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            error && "border-red-400",
          )}
          placeholder={placeholder}
        />
        {rightSlot ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightSlot}</div>
        ) : null}
      </div>
      {error ? (
        <p id={describedBy} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
