type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-4 text-muted-foreground">Content coming soon.</p>
    </>
  );
}
