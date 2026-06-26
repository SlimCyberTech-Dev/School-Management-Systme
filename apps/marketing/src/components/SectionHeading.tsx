type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-prose ${alignClass} ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className={`text-heading-1 ${eyebrow ? "mt-2" : ""}`}>{title}</h2>
      {description ? <p className="mt-3 text-body-lg text-muted-foreground">{description}</p> : null}
    </div>
  );
}
