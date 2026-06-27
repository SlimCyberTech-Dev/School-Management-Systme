import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@uganda-cbc-sms/brand";
import { Container } from "@/components/Container";
import { LegalDocument, legalList } from "@/components/LegalDocument";
import { PageHero } from "@/components/PageHero";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { contactEmail } from "@/lib/contact";
import { createPageMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-06-26";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: `Read how ${BRAND.productName} by ${BRAND.companyName} collects, uses, and protects school and user data.`,
  path: "/privacy",
});

const sections = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p>
          {BRAND.companyName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates {BRAND.productName}, a school management
          platform for Ugandan secondary schools. This Privacy Policy explains how we collect, use, store, and protect
          personal information when you visit our website or use the service on behalf of a school.
        </p>
        <p>
          By using {BRAND.productName}, you acknowledge that personal data will be handled as described here and in any
          service agreement between your school and {BRAND.companyName}.
        </p>
      </>
    ),
  },
  {
    id: "data-we-process",
    title: "Data we process",
    content: (
      <>
        <p>Depending on how your school uses the platform, we may process the following categories of information:</p>
        {legalList([
          "Staff account details — name, email, role, and sign-in activity",
          "Student records — name, class, assessment results, attendance, and photos where uploaded by the school",
          "Fee and payment information recorded by authorised school staff",
          "Enquiries submitted through our website contact form",
          "Technical logs — IP address, browser type, and security-related activity",
        ])}
        <p>
          We do not sell personal data. Schools control what information they enter and which staff accounts they create.
        </p>
      </>
    ),
  },
  {
    id: "legal-framework",
    title: "Legal framework",
    content: (
      <p>
        We aim to comply with the{" "}
        <strong>Uganda Data Protection and Privacy Act, 2019</strong> and applicable regulations. Schools using{" "}
        {BRAND.productName} generally act as data controllers for their learners and staff. {BRAND.companyName} typically
        acts as a data processor when hosting and operating the service on the school&apos;s behalf. Controller and
        processor responsibilities are set out in your service agreement with us.
      </p>
    ),
  },
  {
    id: "how-we-use-data",
    title: "How we use data",
    content: (
      <>
        <p>Personal data is used only for legitimate purposes connected to the service, including to:</p>
        {legalList([
          "Provide, maintain, and improve the school management platform",
          "Authenticate users and enforce role-based access controls",
          "Generate academic and financial reports requested by authorised staff",
          "Respond to enquiries and provide customer support",
          "Monitor and protect the security and integrity of the platform",
        ])}
      </>
    ),
  },
  {
    id: "sharing-and-storage",
    title: "Sharing and storage",
    content: (
      <>
        <p>
          School data is kept logically separate per school. We do not share learner or staff records with other schools
          or unrelated third parties except where required to deliver the service (for example hosting or email
          providers), where the school instructs us to do so, or where the law requires disclosure.
        </p>
        <p>
          Data is stored on secure infrastructure. Production traffic is served over encrypted connections. Access to
          production systems is limited to personnel who need it to operate and support the service.
        </p>
      </>
    ),
  },
  {
    id: "retention-and-security",
    title: "Retention and security",
    content: (
      <p>
        Data is retained for as long as the school&apos;s account remains active and as required by applicable law or
        contractual obligations. When a school ends its subscription, we follow agreed export and deletion procedures.
        We apply technical and organisational measures including access controls, separation of school data, encrypted
        transport, and regular review of access permissions.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <p>
        Under the Uganda Data Protection and Privacy Act, 2019, data subjects may have rights to access, rectify, erase,
        or restrict processing of personal data, subject to lawful exceptions. Learners and parents should direct requests
        to their school in the first instance. {BRAND.companyName} will assist schools, as processor, where applicable
        and as set out in the service agreement.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        For privacy enquiries, contact {BRAND.companyName} at{" "}
        <a href={`mailto:${contactEmail}`} className="link-brand">
          {contactEmail}
        </a>{" "}
        or through our{" "}
        <Link href="/contact" className="link-brand">
          contact page
        </Link>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="page-pad">
      <Container className="max-w-5xl">
        <RevealOnScroll>
          <PageHero
            eyebrow="Legal"
            title="Privacy Policy"
            description={`How ${BRAND.companyName} handles personal data when you use ${BRAND.productName}.`}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <LegalDocument
            lastUpdated={LAST_UPDATED}
            sections={sections}
            related={{ label: "Terms of Service", href: "/terms" }}
          />
        </RevealOnScroll>
      </Container>
    </div>
  );
}
