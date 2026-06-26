import Link from "next/link";
import { faqItems } from "@/lib/faq-data";
import { Container } from "./Container";
import { FaqAccordion } from "./FaqAccordion";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

export function HomeFaqSection() {
  return (
    <section id="faq" className="section-pad scroll-mt-20 bg-neutral-50 dark:bg-neutral-950/50">
      <Container className="max-w-3xl">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Questions"
            title="Frequently asked questions"
            description="Straight answers about CBC, UNEB, fees, security, and getting started."
            align="center"
            className="mx-auto"
          />
        </RevealOnScroll>
        <RevealOnScroll className="mt-10" delay={80}>
          <FaqAccordion items={faqItems} />
        </RevealOnScroll>
        <RevealOnScroll className="mt-8 text-center" delay={120}>
          <p className="text-small text-muted-foreground">
            Still have a question?{" "}
            <Link href="/contact" className="link-brand">
              Send us a message
            </Link>
            .
          </p>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
