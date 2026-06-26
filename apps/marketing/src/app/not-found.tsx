import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Page not found",
  description: "The page you requested could not be found on the SchoolManage marketing site.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-4 text-muted-foreground">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
        Back to home
      </Link>
    </Container>
  );
}
