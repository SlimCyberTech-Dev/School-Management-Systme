"use client";

import { useEffect } from "react";

/** Redirect legacy /faq route to the FAQ section on the home page. */
export default function FaqRedirectPage() {
  useEffect(() => {
    window.location.replace("/#faq");
  }, []);

  return (
    <p className="px-4 py-16 text-center text-muted-foreground">
      Redirecting to frequently asked questions…{" "}
      <a href="/#faq" className="link-brand">
        Continue
      </a>
    </p>
  );
}
