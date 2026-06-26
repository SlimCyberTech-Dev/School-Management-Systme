type CheckIconProps = {
  className?: string;
  variant?: "brand" | "accent";
};

export function CheckIcon({ className = "h-5 w-5", variant = "brand" }: CheckIconProps) {
  const color = variant === "accent" ? "text-accent" : "text-brand";

  return (
    <svg
      className={`mt-0.5 shrink-0 ${color} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
