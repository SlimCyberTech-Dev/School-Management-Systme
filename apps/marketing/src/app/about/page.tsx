import type { Metadata } from "next";
import { BRAND } from "@uganda-cbc-sms/brand";
import { Container } from "@/components/Container";
import { CtaBanner } from "@/components/CtaBanner";
import { PageHero } from "@/components/PageHero";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description: `${BRAND.productName} is school management software for Ugandan secondary schools — student records, O-Level CBC, A-Level UNEB, fees in UGX, and PDF report cards.`,
  path: "/about",
});

const modules = [
  {
    title: "Student records",
    body: "Enrol learners, assign classes, upload photos, and keep attendance and history in one place.",
  },
  {
    title: "O-Level assessment",
    body: "Exam marks per subject, project work, and term composites with A–E grades calculated per NCDC-aligned rules.",
  },
  {
    title: "A-Level UNEB",
    body: "Enter exam marks; the system converts them to UNEB grades, points, and divisions for UACE reporting.",
  },
  {
    title: "Fees",
    body: "Fee structures, invoices, and payment records in Ugandan shillings, with balances visible to your bursar.",
  },
] as const;

const roles = [
  "School administrators — academic years, classes, subjects, and user accounts",
  "Headteachers — school-wide dashboards and report-card approval",
  "Class teachers — daily attendance and class student lists",
  "Subject teachers — assessment entry for their subjects",
  "Bursars — invoicing and payment tracking",
] as const;

export default function AboutPage() {
  return (
    <>
      <div className="page-pad">
        <Container className="max-w-5xl">
          <RevealOnScroll>
            <PageHero
              eyebrow="Product"
              title={`About ${BRAND.productName}`}
              description="A web-based school management system for Ugandan secondary schools — enrolment, assessments, fees, and report cards on one platform."
            />
          </RevealOnScroll>

          <RevealOnScroll delay={60} className="mt-10 md:mt-12">
            <section className="surface-card p-6 md:p-8">
              <h2 className="text-heading-1">What it is</h2>
              <div className="mt-4 max-w-prose space-y-4 text-body text-muted-foreground">
                <p>
                  {BRAND.productName} replaces the mix of paper registers, handwritten report cards, and disconnected
                  spreadsheets that many secondary schools still rely on. Student data, assessment results, and fee
                  records live in one system, tied to the same academic structure.
                </p>
                <p>
                  Each staff member signs in with a role that controls what they see. A subject teacher enters marks for
                  their papers; a bursar works on invoices; a headteacher reviews reports before they leave the school.
                </p>
              </div>
            </section>
          </RevealOnScroll>

          <RevealOnScroll delay={100} className="mt-6 md:mt-8">
            <h2 className="text-heading-1">Modules</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {modules.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-5 shadow-card md:p-6"
                >
                  <h3 className="text-heading-3 text-foreground">{item.title}</h3>
                  <p className="mt-2 text-small leading-relaxed text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </RevealOnScroll>

          <div className="mt-10 grid gap-6 md:mt-12 lg:grid-cols-2 lg:gap-8">
            <RevealOnScroll delay={120}>
              <section className="h-full rounded-2xl border border-brand/20 bg-brand-light/40 p-6 dark:bg-brand-dark/20 md:p-8">
                <h2 className="text-heading-1">Roles</h2>
                <ul className="mt-4 space-y-3 text-body text-muted-foreground">
                  {roles.map((role) => (
                    <li key={role} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                      <span>{role}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </RevealOnScroll>

            <RevealOnScroll delay={160}>
              <section className="surface-card h-full p-6 md:p-8">
                <h2 className="text-heading-1">Typical term workflow</h2>
                <ol className="mt-4 space-y-4 text-body text-muted-foreground">
                  <li className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-small font-semibold text-brand">
                      1
                    </span>
                    <span>Set up the academic year, classes, and subjects, then enrol students.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-small font-semibold text-brand">
                      2
                    </span>
                    <span>Teachers record attendance and enter CBC ratings or UNEB marks through the term.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-small font-semibold text-brand">
                      3
                    </span>
                    <span>Headteachers review submitted assessments and approve report cards for PDF export.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-small font-semibold text-brand">
                      4
                    </span>
                    <span>Bursars issue invoices and record payments against the same student records.</span>
                  </li>
                </ol>
              </section>
            </RevealOnScroll>
          </div>
        </Container>
      </div>

      <CtaBanner
        title="See it for your school"
        description="Request a walkthrough or ask how CBC, UNEB, and fees would be set up for your classes."
        primaryLabel="Contact us"
        primaryHref="/contact"
        secondaryLabel="View features"
        secondaryHref="/features"
      />
    </>
  );
}
