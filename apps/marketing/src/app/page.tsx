import Link from "next/link";
import { BRAND } from "@uganda-cbc-sms/brand";
import { Container } from "@/components/Container";
import { CtaBanner } from "@/components/CtaBanner";
import { CtaButton } from "@/components/CtaButton";
import { CurriculumComparison } from "@/components/CurriculumComparison";
import { HeroPreview } from "@/components/HeroPreview";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SectionHeading } from "@/components/SectionHeading";
import { IconAlevel, IconCbc, IconFees, IconMobileMoney, IconRoles } from "@/components/icons";

const highlights = [
  {
    title: "O-Level CBC assessment",
    description:
      "Record strand and competency ratings (A–E), project work, and end-of-cycle exams — with CA and composite grades aligned to NCDC policy.",
    icon: IconCbc,
    accent: "brand" as const,
  },
  {
    title: "A-Level UNEB grading",
    description:
      "Enter numerical scores and let the system convert them to UNEB grades, points, and divisions — ready for UACE reporting.",
    icon: IconAlevel,
    accent: "accent" as const,
  },
  {
    title: "Fees in Ugandan shillings",
    description:
      "Set fee structures, issue invoices, and record cash or mobile money payments — with balances and financial reports for your bursar.",
    icon: IconFees,
    accent: "brand" as const,
  },
  {
    title: "Role-based access",
    description:
      "Separate dashboards for administrators, headteachers, class teachers, subject teachers, and bursars — each person sees only what they need.",
    icon: IconRoles,
    accent: "brand" as const,
  },
] as const;

const accentIconBg = {
  brand: "bg-brand-light text-brand dark:bg-brand-dark/40 dark:text-green-200",
  accent: "bg-accent-light text-accent dark:bg-accent-deep/40 dark:text-blue-200",
};

const steps = [
  {
    step: "1",
    title: "Enrol students",
    description: "Add learners, assign classes, and keep student records in one place instead of paper files.",
  },
  {
    step: "2",
    title: "Enter scores",
    description:
      "Teachers record CBC ratings and project work for O-Level, or exam marks for A-Level. Assessments can be submitted for review.",
  },
  {
    step: "3",
    title: "Generate report cards",
    description:
      "Produce CBC or A-Level report cards as PDFs. Headteachers review and approve before printing or sharing.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid-subtle bg-grid" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-brand/8 blur-3xl"
          aria-hidden
        />
        <Container className="relative grid items-center gap-12 py-section-sm lg:grid-cols-2 lg:gap-16 lg:py-section">
          <div className="max-w-xl">
            <p className="eyebrow">Ugandan secondary schools</p>
            <h1 className="mt-3 text-balance text-display-1">
              Replace paper records with one CBC + UNEB-ready system
            </h1>
            <p className="mt-5 text-body-lg text-muted-foreground">
              {BRAND.productName} helps your school manage students, assessments, fees, and report cards — built for
              O-Level CBC (S1–S4) and A-Level UNEB (S5–S6) on one platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaButton href="/contact">See it in action</CtaButton>
              <Link href="/features" className="btn-secondary">
                View Features
              </Link>
            </div>
          </div>
          <HeroPreview />
        </Container>
      </section>

      <section className="section-pad">
        <Container>
          <RevealOnScroll>
            <SectionHeading
              eyebrow="Curriculum"
              title="Two tracks, one platform"
              description="O-Level and A-Level follow different grading rules — SchoolManage keeps them separate but connected."
            />
          </RevealOnScroll>
          <RevealOnScroll className="mt-10" delay={80}>
            <CurriculumComparison />
          </RevealOnScroll>
        </Container>
      </section>

      <section className="section-pad bg-neutral-50 dark:bg-neutral-950/50">
        <Container>
          <RevealOnScroll>
            <SectionHeading
              eyebrow="Capabilities"
              title="Built for Ugandan schools"
              description="From competency-based O-Level assessment to UNEB point calculations at A-Level — plus fees, attendance, and role-based dashboards your staff already expect."
            />
          </RevealOnScroll>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {highlights.map(({ title, description, icon: Icon, accent }, i) => (
              <RevealOnScroll key={title} delay={i * 60}>
                <article className="surface-card-interactive h-full p-6">
                  <span className={`inline-flex rounded-lg p-2.5 ${accentIconBg[accent]}`}>
                    <Icon />
                  </span>
                  <h3 className="mt-4 text-heading-2">{title}</h3>
                  <p className="mt-2 text-small text-muted-foreground">{description}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
          <RevealOnScroll className="mt-6" delay={240}>
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-brand/25 bg-brand-light/30 px-5 py-4 dark:border-brand/30 dark:bg-brand-dark/15">
              <IconMobileMoney className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
              <p className="text-small text-foreground/80">
                Record fee payments by cash or mobile money, with transaction references kept on file for your bursar.
              </p>
            </div>
          </RevealOnScroll>
        </Container>
      </section>

      <section className="section-pad border-y border-border">
        <Container>
          <RevealOnScroll>
            <SectionHeading
              align="center"
              eyebrow="Workflow"
              title="How it works"
              description="Three straightforward steps from enrolment to approved report cards."
              className="max-w-xl"
            />
          </RevealOnScroll>
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map(({ step, title, description }, i) => (
              <RevealOnScroll key={step} delay={i * 80}>
                <li className="relative md:pt-2 md:text-center">
                  {i < steps.length - 1 ? (
                    <span
                      className="absolute left-8 top-5 hidden h-px w-[calc(100%-2rem)] bg-border md:left-[calc(50%+1.5rem)] md:block md:w-[calc(100%-3rem)]"
                      aria-hidden
                    />
                  ) : null}
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand font-display text-small font-bold text-white shadow-card">
                    {step}
                  </span>
                  <h3 className="mt-4 text-heading-2">{title}</h3>
                  <p className="mt-2 text-small text-muted-foreground">{description}</p>
                </li>
              </RevealOnScroll>
            ))}
          </ol>
        </Container>
      </section>

      <section className="section-pad">
        <Container>
          <RevealOnScroll>
            <blockquote className="surface-card relative overflow-hidden px-6 py-10 sm:px-10">
              <div
                className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-brand"
                aria-hidden
              />
              <p className="font-display text-heading-1 text-balance">
                Designed with input from Ugandan school administrators
              </p>
              <p className="mt-4 max-w-prose text-body-lg text-muted-foreground">
                {BRAND.productName} is shaped around real secondary-school workflows — CBC project work and
                certification, UNEB grade bands, fee collection, and the day-to-day roles of headteachers, teachers, and
                bursars. We focus on clarity and reliability, not buzzwords.
              </p>
            </blockquote>
          </RevealOnScroll>
        </Container>
      </section>

      <CtaBanner
        title="Ready to move beyond paper records?"
        description="Talk to us about a walkthrough for your school, or sign in if you already have an account."
        primaryLabel="See it in action"
        primaryHref="/contact"
        secondaryLabel="View pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}
