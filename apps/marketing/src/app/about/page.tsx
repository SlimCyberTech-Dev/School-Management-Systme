import type { Metadata } from "next";
import { BRAND } from "@uganda-cbc-sms/brand";
import { Container } from "@/components/Container";
import { CtaBanner } from "@/components/CtaBanner";
import { PageHero } from "@/components/PageHero";
import { RevealOnScroll } from "@/components/RevealOnScroll";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${BRAND.companyName} and why we built ${BRAND.productName} for Ugandan secondary schools.`,
};

export default function AboutPage() {
  return (
    <>
      <div className="page-pad">
        <Container>
          <PageHero
            eyebrow="Company"
            title={`About ${BRAND.productName}`}
            description={`${BRAND.productName} is a school management system by ${BRAND.companyName} — built to help Ugandan secondary schools run on reliable digital records instead of paper.`}
          />

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <RevealOnScroll>
              <section className="surface-card h-full p-6 md:p-8">
                <h2 className="text-heading-1">{BRAND.companyName}</h2>
                <div className="mt-4 space-y-4 text-body text-muted-foreground">
                  <p>
                    {BRAND.companyName} builds software for organisations that need practical, dependable tools. Our
                    tagline — &ldquo;{BRAND.companyTagline}&rdquo; — reflects a focus on shipping systems that work in
                    the real world, not slide decks.
                  </p>
                  <p>
                    With {BRAND.productName}, we apply that approach to Ugandan school administration: O-Level CBC
                    assessment, A-Level UNEB grading, student records, fees in Ugandan shillings, and role-based
                    dashboards for the people who run a school every day.
                  </p>
                </div>
              </section>
            </RevealOnScroll>

            <RevealOnScroll delay={80}>
              <section className="h-full rounded-2xl border border-brand/20 bg-brand-light/40 p-6 dark:bg-brand-dark/20 md:p-8">
                <h2 className="text-heading-1">Our mission</h2>
                <p className="mt-4 text-body-lg text-foreground/85">
                  Digitise school administration for Ugandan secondary schools — so headteachers, teachers, and bursars
                  spend less time on manual paperwork and more time supporting learners.
                </p>
              </section>
            </RevealOnScroll>
          </div>

          <RevealOnScroll className="mt-12 md:mt-16">
            <section className="border-l-4 border-accent pl-5 md:pl-6">
              <h2 className="text-heading-1">Why we built this</h2>
              <div className="mt-6 max-w-prose space-y-4 text-body text-muted-foreground">
                <p>
                  Many secondary schools still rely on paper registers, handwritten report cards, and spreadsheets that
                  do not talk to each other. When assessment policy shifts — CBC competency ratings and project work at
                  O-Level, UNEB points and divisions at A-Level — manual processes become harder to sustain and easier to
                  get wrong.
                </p>
                <p>
                  {BRAND.productName} brings enrolment, assessment entry, fee collection, and report generation into one
                  system. Teachers enter scores once; the platform applies the right grading rules; headteachers approve
                  reports before they go out; bursars track who has paid — all with clear roles so staff see only what they
                  need.
                </p>
                <p>
                  We designed the product around workflows described by school administrators and the official assessment
                  frameworks schools already follow — not around generic templates that ignore CBC and UNEB requirements.
                </p>
              </div>
            </section>
          </RevealOnScroll>
        </Container>
      </div>

      <CtaBanner
        title="Want to learn more?"
        description="We are happy to walk through the system and answer questions about CBC, UNEB, or fees setup for your school."
        primaryLabel="Get in touch"
        primaryHref="/contact"
        secondaryLabel="View features"
        secondaryHref="/features"
      />
    </>
  );
}
