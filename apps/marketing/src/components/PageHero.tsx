type PageHeroProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PageHero({ title, description, eyebrow }: PageHeroProps) {
  return (
    <div className="mb-12 max-w-prose border-l-4 border-brand pl-5 md:mb-14 md:pl-6">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className={`text-display-2 text-balance ${eyebrow ? "mt-2" : ""}`}>{title}</h1>
      <p className="mt-4 text-body-lg text-muted-foreground">{description}</p>
    </div>
  );
}
