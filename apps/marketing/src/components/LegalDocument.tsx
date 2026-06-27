import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  lastUpdated: string;
  sections: LegalSection[];
  related?: { label: string; href: string };
};

const listClass = "mt-3 list-disc space-y-2 pl-5 marker:text-brand/70";

export function legalList(items: string[]) {
  return (
    <ul className={listClass}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TableOfContents({
  sections,
  related,
  className = "",
}: {
  sections: LegalSection[];
  related?: LegalDocumentProps["related"];
  className?: string;
}) {
  return (
    <nav aria-label="Table of contents" className={`surface-card p-5 md:p-6 ${className}`}>
      <p className="text-caption uppercase tracking-wide text-muted-foreground">On this page</p>
      <ol className="mt-4 space-y-2.5">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="group flex gap-2 text-small leading-snug text-muted-foreground transition-colors hover:text-brand"
            >
              <span className="shrink-0 font-semibold tabular-nums text-brand/80 group-hover:text-brand">
                {index + 1}.
              </span>
              <span>{section.title}</span>
            </a>
          </li>
        ))}
      </ol>
      {related ? (
        <p className="mt-6 border-t border-border pt-5 text-small text-muted-foreground">
          See also{" "}
          <Link href={related.href} className="link-brand">
            {related.label}
          </Link>
        </p>
      ) : null}
    </nav>
  );
}

export function LegalDocument({ lastUpdated, sections, related }: LegalDocumentProps) {
  return (
    <div className="mt-10 md:mt-12">
      <TableOfContents sections={sections} related={related} className="lg:hidden" />

      <div className="mt-6 grid gap-8 lg:mt-0 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-12">
        <article className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-brand-light/30 px-6 py-4 dark:bg-brand-dark/15 md:px-8 md:py-5">
            <p className="text-small text-muted-foreground">
              Last updated{" "}
              <time dateTime={lastUpdated} className="font-medium text-foreground">
                {new Date(lastUpdated).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </p>
            {related ? (
              <Link href={related.href} className="link-brand text-small lg:hidden">
                {related.label}
              </Link>
            ) : null}
          </div>

          <div className="divide-y divide-border">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 px-6 py-8 md:px-8 md:py-10"
              >
                <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-heading-2">
                  <span className="text-caption font-bold tabular-nums text-brand">{index + 1}</span>
                  <span>{section.title}</span>
                </h2>
                <div className="mt-4 max-w-prose space-y-4 text-body leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </article>

        <TableOfContents sections={sections} related={related} className="hidden lg:block lg:sticky lg:top-24" />
      </div>
    </div>
  );
}
