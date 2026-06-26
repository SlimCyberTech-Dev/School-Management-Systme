import { roleShowcaseItems } from "@/lib/role-showcase";
import { Container } from "./Container";
import { MarketingImage } from "./MarketingImage";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { CheckIcon } from "./CheckIcon";

export function RoleShowcase() {
  return (
    <section id="roles" className="section-pad scroll-mt-20">
      <Container>
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Your team"
            title="Built for every role in the school"
            description="Each staff member signs in to a dashboard matched to their job. Headteachers, teachers, and bursars see only what they need."
          />
        </RevealOnScroll>

        <div className="mt-14 space-y-20 md:space-y-24">
          {roleShowcaseItems.map((role, index) => {
            const imageFirst = index % 2 === 0;

            return (
              <RevealOnScroll key={role.id} delay={60}>
                <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                  <MarketingImage
                    src={role.image}
                    alt={role.imageAlt}
                    className={`aspect-[4/3] shadow-elevated lg:aspect-[5/4] ${imageFirst ? "" : "lg:order-2"}`}
                  />
                  <div className={imageFirst ? "" : "lg:order-1"}>
                    <h3 className="text-heading-1">{role.title}</h3>
                    <p className="mt-3 text-body text-muted-foreground">{role.description}</p>
                    <ul className="mt-6 space-y-3">
                      {role.points.map((point) => (
                        <li key={point} className="flex gap-3 text-small text-foreground">
                          <CheckIcon className="h-4 w-4" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </RevealOnScroll>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
