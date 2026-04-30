import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function Button({
  children,
  variant = "primary",
  loading,
  className = "",
  disabled,
  type = "button",
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand-dark"
      : variant === "secondary"
        ? "border border-brand text-brand bg-white hover:bg-brand-light"
        : "text-brand hover:bg-brand-light";
  return (
    <button
      type={type}
      className={`${base} ${styles} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
}
