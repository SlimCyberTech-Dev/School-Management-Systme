import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { RevealOnScroll } from "@/components/RevealOnScroll";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request a demo, ask about pricing, or get help setting up SchoolManage for your school.",
};

export default function ContactPage() {
  return (
    <div className="page-pad">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <RevealOnScroll>
            <div>
              <PageHero
                eyebrow="Enquiries"
                title="Get in touch"
                description="Tell us about your school and what you need: a walkthrough, a quote, or help with CBC and UNEB setup."
              />
              <ul className="space-y-4 text-small text-muted-foreground">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <span>
                    <span className="font-semibold text-foreground">Include:</span> school name, approximate student
                    count, and whether you need O-Level CBC, A-Level UNEB, fees, or all modules.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <span>
                    <span className="font-semibold text-foreground">Existing customers:</span> use this form for billing
                    or support, or sign in to your school portal to work in the system.
                  </span>
                </li>
              </ul>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <ContactForm />
          </RevealOnScroll>
        </div>
      </Container>
    </div>
  );
}
