import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request a demo, ask about pricing, or get help setting up SchoolManage for your school.",
};

export default function ContactPage() {
  return (
    <div className="page-pad">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div>
            <PageHero
              eyebrow="Enquiries"
              title="Get in touch"
              description="Tell us about your school and what you need — whether that is a walkthrough, a quote, or help with CBC and UNEB setup."
            />
            <div className="space-y-4 text-small text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">What to include:</span> your school name, approximate
                student count, and whether you need O-Level CBC, A-Level UNEB, fees, or all modules.
              </p>
              <p>
                <span className="font-semibold text-foreground">Existing customers:</span> use the same form for billing
                or support questions, or sign in to your school portal if you need to work in the system directly.
              </p>
            </div>
          </div>
          <ContactForm />
        </div>
      </Container>
    </div>
  );
}
