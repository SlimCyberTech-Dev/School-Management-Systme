import { BRAND } from "@uganda-cbc-sms/brand";
import { contactEmail, contactPhone } from "@/lib/contact";
import { absoluteUrl, siteUrl } from "@/lib/seo";

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: BRAND.companyName,
        url: siteUrl,
        logo: absoluteUrl(BRAND.logoIcon),
        email: contactEmail,
        telephone: contactPhone.replace(/\s/g, ""),
        description: BRAND.companyTagline,
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: BRAND.productName,
        url: siteUrl,
        description:
          "School management software for Ugandan secondary schools with O-Level CBC and A-Level UNEB support.",
        publisher: {
          "@type": "Organization",
          name: BRAND.companyName,
          logo: absoluteUrl(BRAND.logoIcon),
        },
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: BRAND.productName,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: siteUrl,
        image: absoluteUrl(BRAND.logoIcon),
        description:
          "Manage students, CBC assessments, UNEB grading, fees, and report cards for Ugandan secondary schools.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "UGX",
          description: "Contact us for a tailored quote based on school size and modules.",
          url: absoluteUrl("/contact"),
        },
        provider: {
          "@type": "Organization",
          name: BRAND.companyName,
          url: siteUrl,
        },
        featureList: [
          "O-Level CBC competency assessment",
          "A-Level UNEB grade and division calculation",
          "Student enrolment and class management",
          "Fees and mobile money recording",
          "Role-based staff dashboards",
          "PDF report card generation",
        ],
      }}
    />
  );
}

export function FaqPageJsonLd({ items }: { items: readonly { question: string; answer: string }[] }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}
