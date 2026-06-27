import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@uganda-cbc-sms/brand";
import { Container } from "@/components/Container";
import { LegalDocument } from "@/components/LegalDocument";
import { PageHero } from "@/components/PageHero";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { contactEmail } from "@/lib/contact";
import { createPageMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-06-26";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Service",
  description: `Terms of service for using ${BRAND.productName}, the school management platform for Ugandan secondary schools.`,
  path: "/terms",
});

const sections = [
  {
    id: "agreement",
    title: "Agreement",
    content: (
      <p>
        By accessing or using {BRAND.productName}, you agree to these Terms of Service on behalf of your school or
        organisation. If you do not agree, you must not use the service. These Terms apply together with any quotation,
        order form, or service agreement signed between your school and {BRAND.companyName}.
      </p>
    ),
  },
  {
    id: "service-description",
    title: "Service description",
    content: (
      <p>
        {BRAND.productName} is a web-based school management system for Ugandan secondary schools. Features may include
        academic structure, student records, O-Level CBC assessment, A-Level UNEB assessment, fees, attendance,
        reporting, and related tools. Available modules depend on your school&apos;s subscription and configuration.
      </p>
    ),
  },
  {
    id: "accounts-and-use",
    title: "Accounts and acceptable use",
    content: (
      <p>
        Schools are responsible for accounts they create, credential security, and ensuring staff use the system only for
        legitimate school purposes. You must not attempt to access another school&apos;s data, reverse engineer the
        platform, interfere with its security, or use the service in violation of applicable law. We may suspend access
        where we reasonably believe these Terms have been breached.
      </p>
    ),
  },
  {
    id: "data-protection",
    title: "Data protection",
    content: (
      <p>
        Processing of personal data is governed by our{" "}
        <Link href="/privacy" className="link-brand">
          Privacy Policy
        </Link>{" "}
        and the <strong>Uganda Data Protection and Privacy Act, 2019</strong>. Schools remain responsible for their
        lawful basis for processing, notices to parents and staff, and the accuracy of data they enter into the system.
      </p>
    ),
  },
  {
    id: "fees-and-payment",
    title: "Fees and payment",
    content: (
      <p>
        Subscription fees, billing cycles, and payment terms are set out in your separate quotation or service agreement.
        Module availability and user limits may depend on your plan. Failure to pay fees when due may result in
        restricted access after reasonable notice.
      </p>
    ),
  },
  {
    id: "availability-and-support",
    title: "Availability and support",
    content: (
      <p>
        We work to keep the service available during school operating hours but do not guarantee uninterrupted access.
        Planned maintenance, updates, and support response times are communicated through agreed channels. Schools
        should maintain their own backups of critical records where required by policy or regulation.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    content: (
      <p>
        {BRAND.companyName} retains ownership of the {BRAND.productName} software, branding, and documentation. Schools
        retain ownership of the data they input. We grant a limited, non-exclusive licence to use the platform for the
        subscription term and solely for the school&apos;s internal administration.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    content: (
      <p>
        To the fullest extent permitted by law, {BRAND.companyName}&apos;s liability is limited as set out in your
        executed service agreement. Assessment outcomes remain the school&apos;s responsibility. The system applies
        configured grading rules but does not replace professional academic judgement or official UNEB and NCDC
        processes.
      </p>
    ),
  },
  {
    id: "changes-and-termination",
    title: "Changes and termination",
    content: (
      <p>
        We may update these Terms from time to time. Material changes will be communicated with reasonable notice where
        practicable. Schools may terminate in accordance with their service agreement. Upon termination, data export and
        deletion follow the contract and applicable law.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about these Terms may be sent to{" "}
        <a href={`mailto:${contactEmail}`} className="link-brand">
          {contactEmail}
        </a>{" "}
        or submitted through our{" "}
        <Link href="/contact" className="link-brand">
          contact page
        </Link>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="page-pad">
      <Container className="max-w-5xl">
        <RevealOnScroll>
          <PageHero
            eyebrow="Legal"
            title="Terms of Service"
            description={`Terms governing use of ${BRAND.productName} provided by ${BRAND.companyName}.`}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <LegalDocument
            lastUpdated={LAST_UPDATED}
            sections={sections}
            related={{ label: "Privacy Policy", href: "/privacy" }}
          />
        </RevealOnScroll>
      </Container>
    </div>
  );
}
