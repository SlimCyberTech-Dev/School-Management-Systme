import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CheckIcon } from "@/components/CheckIcon";
import { CtaBanner } from "@/components/CtaBanner";
import { PageHero } from "@/components/PageHero";
import { RevealOnScroll } from "@/components/RevealOnScroll";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Flexible plans for single schools and multi-campus groups. Contact us for a quote tailored to your school.",
};

const tiers = [
  {
    name: "Starter School",
    description: "For a single secondary school getting started with digital records.",
    features: [
      "Student enrolment and class management",
      "O-Level CBC assessment and report cards",
      "Role-based access for core staff roles",
      "Email support during onboarding",
    ],
  },
  {
    name: "Growing School",
    description: "For schools that need the full academic and finance toolkit.",
    features: [
      "Everything in Starter School",
      "A-Level UNEB assessment and divisions",
      "Fees, invoices, and mobile money recording",
      "Analytics dashboards and report approval workflow",
      "Attendance and timetable modules",
    ],
    highlighted: true,
  },
  {
    name: "Multi-Campus",
    description: "For school groups or operators managing more than one campus.",
    features: [
      "Everything in Growing School",
      "Separate tenant per school with isolated data",
      "Platform administration for provisioning schools",
      "Per-school module toggles (fees, exams, analytics, and more)",
      "Dedicated onboarding and support planning",
    ],
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <div className="page-pad">
        <Container>
          <PageHero
            eyebrow="Plans"
            title="Plans that fit your school"
            description="We offer flexible tiers based on your size and the modules you need. Every plan is quoted individually — no hidden figures on this page."
          />

          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {tiers.map((tier, i) => {
              const highlighted = "highlighted" in tier && tier.highlighted;

              return (
                <RevealOnScroll key={tier.name} delay={i * 70} className="h-full">
                  <article
                    className={`flex h-full flex-col rounded-2xl border p-6 md:p-7 ${
                      highlighted
                        ? "border-brand bg-brand-light/25 shadow-elevated ring-1 ring-brand/15 dark:bg-brand-dark/15"
                        : "surface-card"
                    }`}
                  >
                    {highlighted ? (
                      <span className="mb-3 inline-flex w-fit rounded-full bg-brand px-2.5 py-0.5 text-caption text-white">
                        Most popular
                      </span>
                    ) : null}
                    <h2 className="text-heading-1">{tier.name}</h2>
                    <p className="mt-2 text-small text-muted-foreground">{tier.description}</p>
                    <p className="mt-5 font-display text-heading-2 text-foreground">Contact us for a quote</p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex gap-2.5 text-small text-foreground">
                          <CheckIcon className="h-4 w-4" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/contact"
                      className={`mt-8 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-small font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        highlighted
                          ? "bg-brand text-white hover:bg-brand-dark focus-visible:outline-brand"
                          : "btn-secondary w-full"
                      }`}
                    >
                      Contact us for a quote
                    </Link>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>

          <RevealOnScroll className="mt-12">
            <div className="rounded-xl border border-border bg-muted/40 px-6 py-6">
              <h2 className="text-heading-2">How is pricing calculated?</h2>
              <p className="mt-2 text-small text-muted-foreground">
                Pricing depends on student count and modules enabled. A small day school with CBC only will differ from a
                large campus running fees, A-Level, attendance, and analytics. Tell us your enrolment and priorities on
                the{" "}
                <Link href="/contact" className="link-brand">
                  contact page
                </Link>{" "}
                and we will prepare a quote.
              </p>
            </div>
          </RevealOnScroll>
        </Container>
      </div>

      <CtaBanner
        title="Not sure which plan fits?"
        description="Share your student numbers and which modules you need — we will recommend a tier and send a quote."
        primaryLabel="Contact us"
        primaryHref="/contact"
      />
    </>
  );
}
